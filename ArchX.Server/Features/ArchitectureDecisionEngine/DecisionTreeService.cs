using ArchX.Server.Database;
using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Extension;
using ArchX.Server.Features.Shared.Exteptions;
using ArchX.Server.Features.Shared.Request;
using ArchX.Server.Features.Shared.Response;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.ArchitectureDecision;

public class DecisionTreeService(IDbContextFactory<ArchXContext> dbFactory)
{
    public async Task<PagedResult<SessionCompleteResponse>> GetSessionsAsync(QueryParameter query, long? userIdFilter)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var fieldMap = new Dictionary<string, string>
        {
            { "treetype", "TreeType" },
            { "startedat", "StartedAt" },
            { "completedat", "CompletedAt" },
            { "selectedstylenodeid", "SelectedStyleNodeId" },
            { "id", "Id" },
            { "projectname", "ProjectName" },
            { "ishidden", "IsHidden" },
        };

        FilterMapExtension.RemapQueryFields(query, fieldMap);

        var sessionQuery = context.Sessions
            .Include(s => s.ResultNode)
            .Where(s => s.CompletedAt.HasValue)
            .AsQueryable();

        if (userIdFilter.HasValue)
            sessionQuery = sessionQuery.Where(s => s.UserId == userIdFilter.Value);

        var hasIsHiddenFilter = query.Filters?.ContainsKey(nameof(Session.IsHidden)) == true;
        if (!hasIsHiddenFilter)
            sessionQuery = sessionQuery.Where(s => !s.IsHidden);

        // Список: только сессии по деревьям паттернов; плюс сессии по стилям, для которых нет
        // завершённой сессии паттернов с тем же пользователем/проектом и SelectedStyleNodeId = ResultNodeId стиля.
        sessionQuery = sessionQuery.Where(s =>
            s.TreeType == TreeType.MonolithPatterns
            || s.TreeType == TreeType.ModularMonolithPatterns
            || s.TreeType == TreeType.MicroservicesPatterns
            || (s.TreeType == TreeType.ArchitectureStyle
                && (!s.ResultNodeId.HasValue
                    || !context.Sessions.Any(p =>
                        p.CompletedAt != null
                        && p.UserId == s.UserId
                        && p.ProjectName == s.ProjectName
                        && p.SelectedStyleNodeId == s.ResultNodeId
                        && (p.TreeType == TreeType.MonolithPatterns
                            || p.TreeType == TreeType.ModularMonolithPatterns
                            || p.TreeType == TreeType.MicroservicesPatterns)))));

        sessionQuery = sessionQuery
            .ApplyFilters(query.Filters);

        var totalCount = await sessionQuery.CountAsync();

        if (query.Page > 0 && query.PageSize > 0)
        {
            sessionQuery = sessionQuery
                .ApplySorting(query.SortField, query.SortOrder, nameof(Session.CompletedAt), fallbackDescending: true)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize);
        }
        else
        {
            sessionQuery = sessionQuery
                .ApplySorting(query.SortField, query.SortOrder, nameof(Session.CompletedAt), fallbackDescending: true);
        }

        var sessions = await sessionQuery.ToListAsync();

        var result = new PagedResult<SessionCompleteResponse>();
        result.TotalCount = totalCount;
        var items = new List<SessionCompleteResponse>();
        foreach (var s in sessions)
        {
            var patterns = await DecisionTreeHelper.AggregatePatternsAlongPathAsync(
                context, s.Path, s.ResultNodeId);
            var patternDetails = await DecisionTreeHelper.AggregatePatternDetailsAlongPathAsync(
                context, s.Path, s.ResultNodeId);
            items.Add(new SessionCompleteResponse
            {
                Id = s.Id,
                TreeType = s.TreeType,
                ProjectName = s.ProjectName,
                StartedAt = s.StartedAt,
                CompletedAt = s.CompletedAt!.Value,
                SelectedStyleNodeId = s.SelectedStyleNodeId,
                IsHidden = s.IsHidden,
                Result = new ResultNodeCompletedResponse
                {
                    ArchitectureStyle = s.ResultNode?.ArchitectureStyle,
                    Patterns = patterns,
                    PatternDetails = patternDetails,
                    Description = s.ResultNode?.Description,
                    Pros = s.ResultNode?.Pros,
                    Cons = s.ResultNode?.Cons,
                }
            });
        }

        result.Items = items;
        return result;
    }

    public async Task SetSessionHiddenStateAsync(int sessionId, bool isHidden, long? userIdFilter = null)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null)
            throw new NotFoundException("Сессия не найдена");
        if (userIdFilter.HasValue && session.UserId != userIdFilter.Value)
            throw new NotFoundException("Сессия не найдена");

        session.IsHidden = isHidden;
        await context.SaveChangesAsync();
    }

    public async Task<SessionInProccessResponse?> GetSessionAsync(int sessionId, long? userIdFilter = null)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.CurrentNode)
                .ThenInclude(s => s.IncomingLinks)
            .Include(s => s.CurrentNode)
                .ThenInclude(s => s.OutgoingLinks)
            .Include(s => s.ResultNode)
                .ThenInclude(s => s.IncomingLinks)
            .Include(s => s.ResultNode)
                .ThenInclude(s => s.OutgoingLinks)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new NotFoundException("Сессия не найдена");
        if (userIdFilter.HasValue && session.UserId != userIdFilter.Value)
            throw new NotFoundException("Сессия не найдена");

        List<string>? resultPatterns = null;
        List<PatternDetailResponse>? resultPatternDetails = null;
        if (session.ResultNode != null && session.CompletedAt.HasValue)
        {
            resultPatterns = await DecisionTreeHelper.AggregatePatternsAlongPathAsync(
                context, session.Path, session.ResultNodeId);
            resultPatternDetails = await DecisionTreeHelper.AggregatePatternDetailsAlongPathAsync(
                context, session.Path, session.ResultNodeId);
        }
        else if (session.ResultNode != null)
        {
            resultPatterns = session.ResultNode.Patterns;
            resultPatternDetails = session.ResultNode.Patterns
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => new PatternDetailResponse
                {
                    Name = p,
                    Description = session.ResultNode.Description,
                    Pros = session.ResultNode.Pros ?? new List<string>(),
                    Cons = session.ResultNode.Cons ?? new List<string>(),
                })
                .ToList();
        }

        return new SessionInProccessResponse
        {
            Id = session.Id,
            TreeType = session.TreeType,
            CurrentQuestion = session.CurrentNode?.QuestionText,
            CurrentQuestionDescription = session.CurrentNode?.Type == "Question"
                ? session.CurrentNode.Description
                : null,
            Options = session.CurrentNode?.OutgoingLinks.Select(l => l.Condition).ToList(),
            Completed = session.CompletedAt != null,
            IsStyleSelected = session.IsStyleSelected,
            Result = session.ResultNode != null ? new ResultNodeInProccessResponse
            {
                ArchitectureStyle = session.ResultNode.ArchitectureStyle,
                Patterns = resultPatterns,
                PatternDetails = resultPatternDetails,
                Description = session.ResultNode.Description,
                Pros = session.ResultNode.Pros,
                Cons = session.ResultNode.Cons
            } : null
        };
    }

    public async Task<Session> StartSessionAsync(long userId, string projectName, TreeType treeType)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var root = await DecisionTreeHelper.GetRootNodeAsync(context, treeType);
        if (root == null) 
            throw new NotFoundException("Дерево решений не настроено");

        var session = new Session
        {
            UserId = userId,
            TreeType = treeType,
            ProjectName = projectName,
            StartedAt = DateTime.UtcNow,
            CurrentNodeId = root.Id,
            Answers = new Dictionary<int, string>(),
            Path = new List<int>(),
            IsStyleSelected = treeType != TreeType.ArchitectureStyle
        };

        context.Sessions.Add(session);
        await context.SaveChangesAsync();
        return session;
    }

    public async Task<Session> ProcessAnswerAsync(int sessionId, string answer)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.CurrentNode)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new NotFoundException("Сессия не найдена");
        if (session.CompletedAt != null)
            throw new BadRequestException("Сессия уже завершена");
        if (session.CurrentNode == null)
            throw new BadRequestException("Текущий узел не определён");

        // Сохраняем ответ
        var answers = session.Answers;
        answers[session.CurrentNodeId.GetValueOrDefault()] = answer;
        session.Answers = answers;

        var path = session.Path;
        path.Add(session.CurrentNodeId.GetValueOrDefault());
        session.Path = path;

        // Ищем следующий узел
        var nextNode = await DecisionTreeHelper.GetNextNodeAsync(context, session.CurrentNodeId.GetValueOrDefault(), answer);

        if (nextNode?.Type == "Result")
        {
            session.ResultNodeId = nextNode.Id;
            session.ResultNode = nextNode;
            session.CompletedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return session;
        }
        else
        {
            session.CurrentNodeId = nextNode.Id;
            session.CurrentNode = nextNode;
        }

        await context.SaveChangesAsync();
        return session;
    }

    /// <summary>
    /// Паттерны по всему пути завершённой сессии (вопросы + итоговый узел).
    /// </summary>
    public async Task<List<string>> GetAggregatedPatternsForCompletedSessionAsync(
        IReadOnlyList<int> path,
        int? resultNodeId)
    {
        using var context = await dbFactory.CreateDbContextAsync();
        return await DecisionTreeHelper.AggregatePatternsAlongPathAsync(context, path, resultNodeId);
    }

    public async Task<Session> ContinueWithPatternsAsync(int styleSessionId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var styleSession = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == styleSessionId);

        if (styleSession?.ResultNode?.ArchitectureStyle == null)
            throw new BadRequestException("Стиль архитектуры не выбран");

        var patternsTreeType = DecisionTreeHelper.GetPatternsTreeType(styleSession.ResultNode.ArchitectureStyle);
        var patternsRoot = await DecisionTreeHelper.GetRootNodeAsync(context, patternsTreeType);

        if (patternsRoot == null)
            throw new NotFoundException($"Дерево паттернов для стиля {styleSession.ResultNode.ArchitectureStyle} не найдено");

        var patternsSession = new Session
        {
            UserId = styleSession.UserId,
            ProjectName = styleSession.ProjectName,
            TreeType = patternsTreeType,
            StartedAt = DateTime.UtcNow,
            CurrentNodeId = patternsRoot.Id,
            Answers = new Dictionary<int, string>(),
            Path = new List<int>(),
            IsStyleSelected = true,
            SelectedStyleNodeId = styleSession.ResultNodeId
        };

        context.Sessions.Add(patternsSession);
        await context.SaveChangesAsync();

        return patternsSession;
    }

    public async Task<VisualizationResponse> GetVisualization(TreeType treeType)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var nodes = await context.Nodes
            .Where(n => n.TreeType == treeType)
            .Select(n => new NodeResponse
            {
                Id = n.Id,
                Label = n.Type == "Question" ? n.QuestionText : n.ArchitectureStyle,
                Type = n.Type,
                Patterns = n.Patterns,
                Description = n.Description
            })
            .ToListAsync();

        var edges = await context.Links
            .Where(l => nodes.Select(n => n.Id).Contains(l.ParentId) ||
                       nodes.Select(n => n.Id).Contains(l.ChildId))
            .Select(l => new LinkResponse
            {
                From = l.ParentId,
                To = l.ChildId,
                Label = l.Condition
            })
            .ToListAsync();

        return new VisualizationResponse 
        { 
            Nodes = nodes, 
            Edges = edges, 
            TreeType = treeType 
        };
    }

    public async Task<SessionBranchResponse> GetSessionBranch(int sessionId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new NotFoundException("Сессия не найдена");

        if (session.CompletedAt == null)
            throw new BadRequestException("Сессия ещё не завершена");

        // Получаем путь в правильном порядке (от корня к результату)
        var pathIds = session.Path;

        if (!pathIds.Any())
            throw new BadRequestException("Путь сессии пуст");

        // Загружаем все узлы, которые были в пути
        var nodes = await context.Nodes
            .Where(n => pathIds.Contains(n.Id))
            .ToDictionaryAsync(n => n.Id);

        // Загружаем все связи, которые использовались
        var links = await context.Links
            .Where(l => pathIds.Contains(l.ParentId) && pathIds.Contains(l.ChildId))
            .ToListAsync();

        var aggregatedPatterns = await DecisionTreeHelper.AggregatePatternsAlongPathAsync(
            context, session.Path, session.ResultNodeId);
        var aggregatedPatternDetails = await DecisionTreeHelper.AggregatePatternDetailsAlongPathAsync(
            context, session.Path, session.ResultNodeId);

        // Формируем структуру ветки
        var branch = new SessionBranchResponse
        {
            SessionId = session.Id,
            ProjectName = session.ProjectName,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt.Value,
            Path = new List<PathItemResponse>(),
            Result = new ResultNodeInProccessResponse
            {
                ArchitectureStyle = session.ResultNode?.ArchitectureStyle,
                Patterns = aggregatedPatterns,
                PatternDetails = aggregatedPatternDetails,
                Description = session.ResultNode?.Description,
                Pros = session.ResultNode?.Pros ?? new List<string>(),
                Cons = session.ResultNode?.Cons ?? new List<string>()
            }
        };

        // Проходим по пути и собираем вопросы с ответами
        for (int i = 0; i < pathIds.Count; i++)
        {
            var nodeId = pathIds[i];
            var node = nodes[nodeId];

            var pathItem = new PathItemResponse
            {
                NodeId = node.Id,
                Question = node.QuestionText,
                Type = node.Type
            };

            // Для вопроса добавляем ответ, который был дан
            if (node.Type == "Question" && session.Answers.ContainsKey(nodeId))
            {
                pathItem.Answer = session.Answers[nodeId];

                // Находим следующий узел, чтобы показать куда привели
                var nextLink = links.FirstOrDefault(l => l.ParentId == nodeId && l.Condition == pathItem.Answer);
                if (nextLink != null)
                {
                    pathItem.LeadsToNodeId = nextLink.ChildId;

                    // Если следующий узел - ответ, добавляем его название
                    if (nodes.ContainsKey(nextLink.ChildId) && nodes[nextLink.ChildId].Type == "Answer")
                    {
                        pathItem.LeadsToArchitecture = nodes[nextLink.ChildId].ArchitectureStyle;
                    }
                }
            }

            branch.Path.Add(pathItem);
        }

        // Добавляем итоговый узел
        if (session.ResultNode != null)
        {
            branch.Path.Add(new PathItemResponse
            {
                NodeId = session.ResultNode.Id,
                Question = session.ResultNode.ArchitectureStyle,
                Type = "Answer",
                IsResult = true
            });
        }

        return branch;
    }

    public async Task<SessionTreeResponse> GetSessionTree(int sessionId, long? userIdFilter = null)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new NotFoundException("Сессия не найдена");
        if (userIdFilter.HasValue && session.UserId != userIdFilter.Value)
            throw new NotFoundException("Сессия не найдена");

        if (session.CompletedAt == null)
            throw new BadRequestException("Сессия ещё не завершена");

        var pathIds = session.Path;
        var nodes = await context.Nodes
            .Where(n => pathIds.Contains(n.Id))
            .ToDictionaryAsync(n => n.Id);

        var aggregatedPatterns = await DecisionTreeHelper.AggregatePatternsAlongPathAsync(
            context, session.Path, session.ResultNodeId);
        var aggregatedPatternDetails = await DecisionTreeHelper.AggregatePatternDetailsAlongPathAsync(
            context, session.Path, session.ResultNodeId);

        // Рекурсивно строим дерево
        var rootNode = await BuildQuestionTree(nodes, session, pathIds[0], 0);

        return new SessionTreeResponse
        {
            SessionId = session.Id,
            ProjectName = session.ProjectName,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt.Value,
            Tree = rootNode,
            Result = new ResultNodeInProccessResponse
            {
                ArchitectureStyle = session.ResultNode?.ArchitectureStyle,
                Patterns = aggregatedPatterns,
                PatternDetails = aggregatedPatternDetails,
                Description = session.ResultNode?.Description,
                Pros = session.ResultNode?.Pros,
                Cons = session.ResultNode?.Cons,
            }
        };
    }

    private async Task<QuestionNodeResponse> BuildQuestionTree(
        Dictionary<int, Node> nodes,
        Session session,
        int currentNodeId,
        int depth)
    {
        var node = nodes[currentNodeId];

        var dto = new QuestionNodeResponse
        {
            NodeId = node.Id,
            Question = node.QuestionText,
            Answer = session.Answers.ContainsKey(node.Id) ? session.Answers[node.Id] : null
        };

        // Если есть ответ и это не последний узел
        if (dto.Answer != null && depth < session.Path.Count - 1)
        {
            // Находим следующий узел в пути
            var nextNodeId = session.Path[depth + 1];
            dto.NextNode = await BuildQuestionTree(nodes, session, nextNodeId, depth + 1);
        }

        return dto;
    }

    /// <summary>
    /// Возвращает объединённое дерево: для сессии по стилям — только дерево стилей;
    /// для сессии по паттернам — дерево стилей (родительская сессия) + дерево паттернов.
    /// </summary>
    public async Task<CombinedSessionTreeResponse> GetCombinedSessionTree(int sessionId, long? userIdFilter = null)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new NotFoundException("Сессия не найдена");
        if (userIdFilter.HasValue && session.UserId != userIdFilter.Value)
            throw new NotFoundException("Сессия не найдена");
        if (session.CompletedAt == null)
            throw new BadRequestException("Сессия ещё не завершена");

        if (session.TreeType == TreeType.ArchitectureStyle)
        {
            var styleTree = await GetSessionTree(sessionId, userIdFilter);
            return new CombinedSessionTreeResponse { StyleTree = styleTree, PatternsTree = null };
        }

        if (session.SelectedStyleNodeId.HasValue)
        {
            var styleSession = await context.Sessions
                .FirstOrDefaultAsync(s =>
                    s.UserId == session.UserId
                    && s.ResultNodeId == session.SelectedStyleNodeId
                    && s.TreeType == TreeType.ArchitectureStyle
                    && s.CompletedAt != null);
            if (styleSession != null)
            {
                var styleTree = await GetSessionTree(styleSession.Id, userIdFilter);
                var patternsTree = await GetSessionTree(sessionId, userIdFilter);
                return new CombinedSessionTreeResponse { StyleTree = styleTree, PatternsTree = patternsTree };
            }
        }

        var onlyPatternsTree = await GetSessionTree(sessionId, userIdFilter);
        return new CombinedSessionTreeResponse { StyleTree = null, PatternsTree = onlyPatternsTree };
    }
}

public static class DecisionTreeHelper 
{
    public static TreeType GetPatternsTreeType(string architectureStyle)
    {
        return architectureStyle?.ToLower() switch
        {
            var s when s.Contains("монолит") && !s.Contains("модульный") => TreeType.MonolithPatterns,
            var s when s.Contains("модульный монолит") => TreeType.ModularMonolithPatterns,
            var s when s.Contains("микросервисы") => TreeType.MicroservicesPatterns,
            _ => TreeType.MonolithPatterns
        };
    }

    public static async Task<Node?> GetRootNodeAsync(ArchXContext context, TreeType treeType)
    {
        return await context.Nodes
            .Include(n => n.OutgoingLinks)
            .ThenInclude(l => l.Child)
            .Where(n => n.TreeType == treeType)
            .FirstOrDefaultAsync(n => !n.IncomingLinks.Any());
    }

    public static async Task<Node?> GetNextNodeAsync(ArchXContext context, int currentNodeId, string answer)
    {
        var link = await context.Links
            .Include(l => l.Child)
            .FirstOrDefaultAsync(l => l.ParentId == currentNodeId && l.Condition == answer);

        return link?.Child;
    }

    /// <summary>
    /// Объединяет паттерны узлов вдоль пройденного пути (вопросы) и итогового узла.
    /// Порядок: как в пути слева направо, затем паттерны результата; дубликаты по строке опускаются (первое вхождение).
    /// </summary>
    public static async Task<List<string>> AggregatePatternsAlongPathAsync(
        ArchXContext context,
        IReadOnlyList<int> pathNodeIds,
        int? resultNodeId)
    {
        if (pathNodeIds.Count == 0 && !resultNodeId.HasValue)
            return new List<string>();

        var idSet = new HashSet<int>();
        foreach (var id in pathNodeIds)
            idSet.Add(id);
        if (resultNodeId.HasValue)
            idSet.Add(resultNodeId.Value);

        var nodes = await context.Nodes
            .AsNoTracking()
            .Where(n => idSet.Contains(n.Id))
            .ToDictionaryAsync(n => n.Id);

        static void AddPatterns(Node? node, List<string> ordered, HashSet<string> seen)
        {
            if (node == null) return;
            foreach (var p in node.Patterns)
            {
                if (string.IsNullOrWhiteSpace(p)) continue;
                if (seen.Add(p))
                    ordered.Add(p);
            }
        }

        var ordered = new List<string>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var id in pathNodeIds)
        {
            if (nodes.TryGetValue(id, out var node))
                AddPatterns(node, ordered, seen);
        }

        if (resultNodeId.HasValue && nodes.TryGetValue(resultNodeId.Value, out var result))
            AddPatterns(result, ordered, seen);

        return ordered;
    }

    public static async Task<List<PatternDetailResponse>> AggregatePatternDetailsAlongPathAsync(
        ArchXContext context,
        IReadOnlyList<int> pathNodeIds,
        int? resultNodeId)
    {
        if (pathNodeIds.Count == 0 && !resultNodeId.HasValue)
            return new List<PatternDetailResponse>();

        var idSet = new HashSet<int>();
        foreach (var id in pathNodeIds)
            idSet.Add(id);
        if (resultNodeId.HasValue)
            idSet.Add(resultNodeId.Value);

        var nodes = await context.Nodes
            .AsNoTracking()
            .Where(n => idSet.Contains(n.Id))
            .ToDictionaryAsync(n => n.Id);

        static void AddPatternDetails(
            Node? node,
            List<PatternDetailResponse> ordered,
            HashSet<string> seen)
        {
            if (node == null) return;

            foreach (var pattern in node.Patterns)
            {
                if (string.IsNullOrWhiteSpace(pattern)) continue;
                if (!seen.Add(pattern)) continue;

                ordered.Add(new PatternDetailResponse
                {
                    Name = pattern,
                    Description = node.Description,
                    Pros = node.Pros?.Count > 0 ? new List<string>(node.Pros) : new List<string>(),
                    Cons = node.Cons?.Count > 0 ? new List<string>(node.Cons) : new List<string>(),
                });
            }
        }

        var ordered = new List<PatternDetailResponse>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var id in pathNodeIds)
        {
            if (nodes.TryGetValue(id, out var node))
                AddPatternDetails(node, ordered, seen);
        }

        if (resultNodeId.HasValue && nodes.TryGetValue(resultNodeId.Value, out var result))
            AddPatternDetails(result, ordered, seen);

        return ordered;
    }
}

