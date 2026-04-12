using ArchX.Server.Features.Shared.Exteptions;
using ArchX.Server.Features.Shared.Request;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;

namespace ArchX.Server.Features.Shared.Extension;

public static class FilterMapExtension
{
    public static void RemapQueryFields(QueryParameter? query, Dictionary<string, string> filterMap)
    {
        if (query == null)
            return;

        if (query.Filters != null)
        {
            var remappedFilters = new Dictionary<string, string>();

            foreach (var kvp in query.Filters)
            {
                if (filterMap.TryGetValue(kvp.Key.ToLower(), out var mappedKey))
                    remappedFilters[mappedKey] = kvp.Value;
                else
                    remappedFilters[kvp.Key] = kvp.Value;
            }

            query.Filters = remappedFilters;
        }
        if (!string.IsNullOrEmpty(query.SortField) &&
            filterMap.TryGetValue(query.SortField.ToLower(), out var mappedSortField))
        {
            query.SortField = mappedSortField;
        }
    }
}

public static class QueryableQueryExtensions
{
    private static readonly string[] SupportedOperators = ["!=", ">=", "<=", "=", ">", "<"];

    public static IQueryable<T> ApplyFilters<T>(
        this IQueryable<T> query,
        IReadOnlyDictionary<string, string>? filters)
    {
        if (filters == null || filters.Count == 0)
            return query;

        foreach (var (field, filter) in filters)
        {
            if (string.IsNullOrWhiteSpace(field) || string.IsNullOrWhiteSpace(filter))
                continue;

            var predicate = BuildPredicateExpression<T>(field.Trim(), filter.Trim());
            query = query.Where(predicate);
        }

        return query;
    }

    public static IQueryable<T> ApplySorting<T>(
        this IQueryable<T> query,
        string? sortField,
        string? sortOrder,
        string? fallbackSortField = null,
        bool fallbackDescending = false)
    {
        var requestedField = string.IsNullOrWhiteSpace(sortField) ? null : sortField.Trim();
        var fieldToSort = requestedField ?? fallbackSortField;
        if (string.IsNullOrWhiteSpace(fieldToSort))
            return query;

        var keySelector = BuildMemberSelectorLambda<T>(fieldToSort);
        var keyType = keySelector.Body.Type;

        var descending = requestedField == null
            ? fallbackDescending
            : IsDescendingSort(sortOrder);

        var methodName = descending ? nameof(Queryable.OrderByDescending) : nameof(Queryable.OrderBy);
        var orderMethod = typeof(Queryable)
            .GetMethods(BindingFlags.Public | BindingFlags.Static)
            .Single(m =>
                m.Name == methodName
                && m.GetParameters().Length == 2);

        var genericMethod = orderMethod.MakeGenericMethod(typeof(T), keyType);
        return (IQueryable<T>)genericMethod.Invoke(null, [query, keySelector])!;
    }

    private static Expression<Func<T, bool>> BuildPredicateExpression<T>(string fieldPath, string rawFilter)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        var (memberAccess, nullCheck) = BuildMemberAccessExpression(parameter, fieldPath, withNullChecks: true);

        var filterExpression = BuildFilterExpression(memberAccess, rawFilter, fieldPath);
        if (nullCheck != null)
            filterExpression = Expression.AndAlso(nullCheck, filterExpression);

        return Expression.Lambda<Func<T, bool>>(filterExpression, parameter);
    }

    private static LambdaExpression BuildMemberSelectorLambda<T>(string fieldPath)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        var (memberAccess, _) = BuildMemberAccessExpression(parameter, fieldPath, withNullChecks: false);
        return Expression.Lambda(memberAccess, parameter);
    }

    private static (Expression Member, Expression? NullCheck) BuildMemberAccessExpression(
        ParameterExpression parameter,
        string fieldPath,
        bool withNullChecks)
    {
        var segments = fieldPath.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (segments.Length == 0)
            throw new BadRequestException($"Некорректное поле фильтрации: '{fieldPath}'.");

        Expression current = parameter;
        Expression? nullCheck = null;

        foreach (var segment in segments)
        {
            var property = current.Type
                .GetProperties(BindingFlags.Instance | BindingFlags.Public)
                .FirstOrDefault(p => string.Equals(p.Name, segment, StringComparison.OrdinalIgnoreCase));

            if (property == null)
                throw new BadRequestException(
                    $"Поле '{segment}' не найдено в типе '{current.Type.Name}' (путь: '{fieldPath}').");

            if (withNullChecks && current != parameter && CanBeNull(current.Type))
            {
                var currentNotNull = Expression.NotEqual(current, Expression.Constant(null, current.Type));
                nullCheck = nullCheck == null ? currentNotNull : Expression.AndAlso(nullCheck, currentNotNull);
            }

            current = Expression.Property(current, property);
        }

        return (current, nullCheck);
    }

    private static Expression BuildFilterExpression(Expression memberAccess, string rawFilter, string fieldPath)
    {
        var (operation, operandRaw) = ParseOperation(rawFilter);
        var nonNullableType = Nullable.GetUnderlyingType(memberAccess.Type) ?? memberAccess.Type;

        if (nonNullableType == typeof(string))
            return BuildStringFilterExpression(memberAccess, operation, operandRaw);

        if (string.IsNullOrWhiteSpace(operandRaw))
            throw new BadRequestException($"Значение фильтра для поля '{fieldPath}' не может быть пустым.");

        var typedOperand = ConvertStringToType(operandRaw, nonNullableType, fieldPath);
        return BuildTypedFilterExpression(memberAccess, operation, typedOperand, nonNullableType, fieldPath);
    }

    private static Expression BuildStringFilterExpression(Expression memberAccess, string? operation, string operandRaw)
    {
        var value = operandRaw;
        var hasLikePattern = value.Contains('%');
        var memberNotNull = Expression.NotEqual(memberAccess, Expression.Constant(null, memberAccess.Type));

        if (operation is ">" or "<" or ">=" or "<=")
            throw new BadRequestException("Для строк доступны только операции '=', '!=' или шаблон с '%'.");

        if (string.IsNullOrEmpty(value))
            throw new BadRequestException("Значение строкового фильтра не может быть пустым.");

        if (hasLikePattern)
        {
            var likeExpression = BuildLikeExpression(memberAccess, value);
            return operation == "!="
                ? Expression.OrElse(Expression.Equal(memberAccess, Expression.Constant(null, memberAccess.Type)), Expression.Not(likeExpression))
                : Expression.AndAlso(memberNotNull, likeExpression);
        }

        if (operation == "!=")
        {
            var equalsExpression = BuildCaseInsensitiveEqualsExpression(memberAccess, value);
            return Expression.OrElse(Expression.Equal(memberAccess, Expression.Constant(null, memberAccess.Type)), Expression.Not(equalsExpression));
        }

        if (operation == "=")
            return Expression.AndAlso(memberNotNull, BuildCaseInsensitiveEqualsExpression(memberAccess, value));

        // По умолчанию для строк без оператора — contains.
        return Expression.AndAlso(memberNotNull, BuildCaseInsensitiveContainsExpression(memberAccess, value));
    }

    private static Expression BuildTypedFilterExpression(
        Expression memberAccess,
        string? operation,
        object typedOperand,
        Type nonNullableType,
        string fieldPath)
    {
        operation ??= "=";
        if (!SupportedOperators.Contains(operation))
            throw new BadRequestException($"Оператор '{operation}' не поддерживается для поля '{fieldPath}'.");

        var isRelationalOperation = operation is ">" or "<" or ">=" or "<=";
        if (isRelationalOperation && !SupportsRelationalComparison(nonNullableType))
        {
            throw new BadRequestException(
                $"Операторы сравнения ('>', '<', '>=', '<=') не поддерживаются для поля '{fieldPath}' типа '{nonNullableType.Name}'.");
        }

        var constant = Expression.Constant(typedOperand, nonNullableType);

        if (Nullable.GetUnderlyingType(memberAccess.Type) != null)
        {
            var hasValue = Expression.Property(memberAccess, nameof(Nullable<int>.HasValue));
            var value = Expression.Property(memberAccess, nameof(Nullable<int>.Value));
            var comparison = BuildComparisonExpression(value, constant, operation, fieldPath);

            return operation switch
            {
                "=" => Expression.AndAlso(hasValue, comparison),
                "!=" => Expression.OrElse(Expression.Not(hasValue), comparison),
                _ => Expression.AndAlso(hasValue, comparison),
            };
        }

        return BuildComparisonExpression(memberAccess, constant, operation, fieldPath);
    }

    private static Expression BuildComparisonExpression(
        Expression left,
        Expression right,
        string operation,
        string fieldPath)
    {
        return operation switch
        {
            "=" => Expression.Equal(left, right),
            "!=" => Expression.NotEqual(left, right),
            ">" => Expression.GreaterThan(left, right),
            "<" => Expression.LessThan(left, right),
            ">=" => Expression.GreaterThanOrEqual(left, right),
            "<=" => Expression.LessThanOrEqual(left, right),
            _ => throw new BadRequestException($"Оператор '{operation}' не поддерживается для поля '{fieldPath}'."),
        };
    }

    private static Expression BuildLikeExpression(Expression memberAccess, string rawPattern)
    {
        var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
        var memberLower = Expression.Call(memberAccess, toLowerMethod);
        var patternLower = Expression.Constant(rawPattern.ToLowerInvariant());

        var likeMethod = typeof(DbFunctionsExtensions).GetMethod(
            nameof(DbFunctionsExtensions.Like),
            [typeof(DbFunctions), typeof(string), typeof(string)])!;

        return Expression.Call(
            likeMethod,
            Expression.Property(null, typeof(EF), nameof(EF.Functions)),
            memberLower,
            patternLower);
    }

    private static Expression BuildCaseInsensitiveEqualsExpression(Expression memberAccess, string value)
    {
        var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
        var memberLower = Expression.Call(memberAccess, toLowerMethod);
        var valueLower = Expression.Constant(value.ToLowerInvariant());
        return Expression.Equal(memberLower, valueLower);
    }

    private static Expression BuildCaseInsensitiveContainsExpression(Expression memberAccess, string value)
    {
        var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
        var containsMethod = typeof(string).GetMethod(nameof(string.Contains), [typeof(string)])!;

        var memberLower = Expression.Call(memberAccess, toLowerMethod);
        var valueLower = Expression.Constant(value.ToLowerInvariant());
        return Expression.Call(memberLower, containsMethod, valueLower);
    }

    private static (string? Operation, string Operand) ParseOperation(string rawFilter)
    {
        foreach (var operation in SupportedOperators)
        {
            if (rawFilter.StartsWith(operation, StringComparison.Ordinal))
            {
                var operand = rawFilter[operation.Length..].Trim();
                return (operation, operand);
            }
        }

        return (null, rawFilter.Trim());
    }

    private static bool IsDescendingSort(string? sortOrder)
    {
        return string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase)
               || string.Equals(sortOrder, "descending", StringComparison.OrdinalIgnoreCase);
    }

    private static bool CanBeNull(Type type)
    {
        return !type.IsValueType || Nullable.GetUnderlyingType(type) != null;
    }

    private static bool SupportsRelationalComparison(Type type)
    {
        if (type.IsEnum)
            return false;

        return Type.GetTypeCode(type) switch
        {
            TypeCode.Byte => true,
            TypeCode.SByte => true,
            TypeCode.Int16 => true,
            TypeCode.UInt16 => true,
            TypeCode.Int32 => true,
            TypeCode.UInt32 => true,
            TypeCode.Int64 => true,
            TypeCode.UInt64 => true,
            TypeCode.Single => true,
            TypeCode.Double => true,
            TypeCode.Decimal => true,
            TypeCode.DateTime => true,
            _ => false,
        };
    }

    private static object ConvertStringToType(string value, Type targetType, string fieldPath)
    {
        try
        {
            if (targetType == typeof(string))
                return value;

            if (targetType == typeof(bool))
            {
                if (bool.TryParse(value, out var boolResult))
                    return boolResult;
                if (value == "1")
                    return true;
                if (value == "0")
                    return false;

                throw new BadRequestException($"Некорректное булево значение '{value}' для поля '{fieldPath}'.");
            }

            if (targetType.IsEnum)
            {
                if (int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var intEnum))
                    return Enum.ToObject(targetType, intEnum);

                return Enum.Parse(targetType, value, ignoreCase: true);
            }

            if (targetType == typeof(DateTime))
            {
                var formats = new[]
                {
                    "dd.MM.yyyy",
                    "dd.MM.yyyy HH:mm:ss",
                    "yyyy-MM-dd",
                    "yyyy-MM-ddTHH:mm:ss",
                    "yyyy-MM-ddTHH:mm:ss.fff",
                    "O",
                };

                if (DateTime.TryParseExact(
                        value,
                        formats,
                        CultureInfo.GetCultureInfo("ru-RU"),
                        DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                        out var dateExact))
                {
                    return EnsureUtcDateTime(dateExact);
                }

                if (DateTime.TryParse(
                        value,
                        CultureInfo.GetCultureInfo("ru-RU"),
                        DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                        out var dateRu))
                {
                    return EnsureUtcDateTime(dateRu);
                }

                if (DateTime.TryParse(
                        value,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                        out var dateInvariant))
                {
                    return EnsureUtcDateTime(dateInvariant);
                }

                throw new BadRequestException($"Некорректная дата '{value}' для поля '{fieldPath}'.");
            }

            if (targetType == typeof(Guid))
            {
                if (Guid.TryParse(value, out var guid))
                    return guid;
                throw new BadRequestException($"Некорректный GUID '{value}' для поля '{fieldPath}'.");
            }

            return Convert.ChangeType(value, targetType, CultureInfo.InvariantCulture)
                   ?? throw new BadRequestException($"Не удалось преобразовать '{value}' к типу '{targetType.Name}'.");
        }
        catch (DomainException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new BadRequestException($"Некорректное значение '{value}' для поля '{fieldPath}'.");
        }
    }

    private static DateTime EnsureUtcDateTime(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };
    }
}
