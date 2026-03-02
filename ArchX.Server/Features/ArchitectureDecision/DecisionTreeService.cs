using ArchX.Server.Database;
using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.ArchitectureDecision;

public class DecisionTreeService(IDbContextFactory<ArchXContext> dbFactory)
{
    /// <summary>
    /// Получить корневой узел (начало дерева)
    /// </summary>
    public async Task<Node?> GetRootNodeAsync(TreeType treeType)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        return await context.Nodes
            .Include(n => n.OutgoingLinks)
            .ThenInclude(l => l.Child)
            .Where(n => n.TreeType == treeType)
            .FirstOrDefaultAsync(n => !n.IncomingLinks.Any());
    }

    /// <summary>
    /// Получить следующий узел по ответу
    /// </summary>
    public async Task<Node?> GetNextNodeAsync(int currentNodeId, string answer)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var link = await context.Links
            .Include(l => l.Child)
            .FirstOrDefaultAsync(l => l.ParentId == currentNodeId && l.Condition == answer);

        return link?.Child;
    }

    /// <summary>
    /// Получить дерево для выбора паттернов на основе выбранного стиля
    /// </summary>
    public TreeType GetPatternsTreeType(string architectureStyle)
    {
        return architectureStyle?.ToLower() switch
        {
            var s when s.Contains("монолит") && !s.Contains("модульный") => TreeType.MonolithPatterns,
            var s when s.Contains("модульный монолит") => TreeType.ModularMonolithPatterns,
            var s when s.Contains("микросервисы") => TreeType.MicroservicesPatterns,
            _ => TreeType.MonolithPatterns // По умолчанию
        };
    }

    /// <summary>
    /// Начать новую сессию
    /// </summary>
    public async Task<Session> StartSessionAsync(long userId, string projectName, TreeType treeType)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var root = await GetRootNodeAsync(treeType);
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

    /// <summary>
    /// Обработать ответ и перейти дальше
    /// </summary>
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
        var nextNode = await GetNextNodeAsync(session.CurrentNodeId.GetValueOrDefault(), answer);

        if (nextNode?.Type == "Result")
        {
            // Это узел-результат, завершаем сессию
            session.ResultNodeId = nextNode.Id;
            session.ResultNode = nextNode;
            session.CompletedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return session;
        }
        #region

        //if (nextNode == null)
        //{
        //    // Если нет следующего узла, считаем текущий узел ответом (листом)
        //    session.ResultNodeId = session.CurrentNodeId;

        //    // Если это было дерево выбора стиля, запоминаем выбранный стиль
        //    if (session.TreeType == TreeType.ArchitectureStyle && session.CurrentNode?.ArchitectureStyle != null)
        //    {
        //        session.SelectedStyleNodeId = session.CurrentNodeId;
        //        session.IsStyleSelected = true;

        //        // Автоматически начинаем дерево паттернов для выбранного стиля
        //        //var patternsTreeType = GetPatternsTreeType(session.CurrentNode.TreeType);
        //        var patternsRoot = await GetRootNodeAsync(session.CurrentNode.TreeType);

        //        if (patternsRoot != null)
        //        {
        //            // Создаём новую сессию для паттернов
        //            var patternsSession = new Session
        //            {
        //                UserId = session.UserId,
        //                ProjectName = session.ProjectName,
        //                TreeType = session.CurrentNode.TreeType,
        //                StartedAt = DateTime.UtcNow,
        //                CurrentNodeId = patternsRoot.Id,
        //                Answers = new Dictionary<int, string>(),
        //                Path = new List<int>(),
        //                IsStyleSelected = true,
        //                SelectedStyleNodeId = session.CurrentNodeId
        //            };

        //            context.Sessions.Add(patternsSession);
        //            await context.SaveChangesAsync();

        //            // Завершаем текущую сессию
        //            session.CompletedAt = DateTime.UtcNow;
        //            session.CurrentNodeId = null;
        //            await context.SaveChangesAsync();

        //            // Возвращаем новую сессию
        //            return patternsSession;
        //        }
        //    }

        //    session.CompletedAt = DateTime.UtcNow;
        //    session.CurrentNodeId = null;
        //}
        #endregion
        else
        {
            session.CurrentNodeId = nextNode.Id;
            session.CurrentNode = nextNode;
        }

        await context.SaveChangesAsync();
        return session;
    }


    public async Task<Session> ContinueWithPatternsAsync(int styleSessionId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var styleSession = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == styleSessionId);

        if (styleSession?.ResultNode?.ArchitectureStyle == null)
            throw new BadRequestException("Стиль архитектуры не выбран");

        var patternsTreeType = GetPatternsTreeType(styleSession.ResultNode.ArchitectureStyle);
        var patternsRoot = await GetRootNodeAsync(patternsTreeType);

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


    /// <summary>
    /// Получить текущее состояние сессии
    /// </summary>
    public async Task<Session?> GetSessionAsync(int sessionId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        return await context.Sessions
            .Include(s => s.CurrentNode)
                .ThenInclude(s => s.IncomingLinks)
            .Include(s => s.CurrentNode)
                .ThenInclude(s => s.OutgoingLinks)
            .Include(s => s.ResultNode)
                .ThenInclude(s => s.IncomingLinks)
            .Include(s => s.ResultNode)
                .ThenInclude(s => s.OutgoingLinks)
            .FirstOrDefaultAsync(s => s.Id == sessionId);
    }

}

