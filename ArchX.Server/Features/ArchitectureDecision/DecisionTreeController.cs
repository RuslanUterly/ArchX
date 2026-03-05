using ArchX.Server.Database;
using ArchX.Server.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.ArchitectureDecision;

[ApiController]
[Route("api/v1/[controller]")]
public class DecisionTreeController(DecisionTreeService service, IDbContextFactory<ArchXContext> dbFactory) : ControllerBase
{
    /// <summary>
    /// Начать новую сессию
    /// </summary>
    [HttpPost("start/{userId}")]
    public async Task<IActionResult> StartSession(long userId, [FromBody] StartSessionRequest request)
    {
        var session = await service.StartSessionAsync(userId, request.ProjectName, request.TreeType);

        return Ok(await service.GetSessionAsync(session.Id));
    }

    /// <summary>
    /// Отправить ответ и получить следующий вопрос или результат
    /// </summary>
    [HttpPost("{sessionId}/answer")]
    public async Task<IActionResult> PostAnswer(int sessionId, [FromBody] AnswerRequest request)
    {
        var session = await service.ProcessAnswerAsync(sessionId, request.Answer);

        if (session.CompletedAt != null)
        {
            // Сессия завершена, возвращаем результат
            var resultNode = session.ResultNode;
            return Ok(new
            {
                Id = session.Id,
                Completed = true,
                TreeType = session.TreeType,
                ArchitectureStyle = resultNode.ArchitectureStyle,
                Patterns = resultNode.Patterns,
                Description = resultNode.Description,
                Pros = resultNode.Pros,
                Cons = resultNode.Cons,
                CanContinueWithPatterns = session.TreeType == TreeType.ArchitectureStyle &&
                                         resultNode?.ArchitectureStyle != null
            });
        }
        else
        {
            // Возвращаем следующий вопрос
            return Ok(await service.GetSessionAsync(session.Id));
        }
    }

    [HttpPost("{styleSessionId}/continue-with-patterns")]
    public async Task<IActionResult> ContinueWithPatterns(int styleSessionId)
    {
        var session = await service.ContinueWithPatternsAsync(styleSessionId);

        return Ok(await service.GetSessionAsync(session.Id));
    }

    /// <summary>
    /// Получить текущее состояние сессии (для восстановления)
    /// </summary>
    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var session = await service.GetSessionAsync(sessionId);
        return Ok(session);
    }

    [HttpGet("visualization/{treeType}")]
    public async Task<IActionResult> GetVisualization(TreeType treeType)
    {
        using var context = await dbFactory.CreateDbContextAsync();
        
        var nodes = await context.Nodes
            .Where(n => n.TreeType == treeType)
            .Select(n => new
            {
                id = n.Id,
                label = n.Type == "Question" ? n.QuestionText : n.ArchitectureStyle,
                type = n.Type,
                patterns = n.Patterns,
                description = n.Description
            })
            .ToListAsync();
            
        var edges = await context.Links
            .Where(l => nodes.Select(n => n.id).Contains(l.ParentId) || 
                       nodes.Select(n => n.id).Contains(l.ChildId))
            .Select(l => new
            {
                from = l.ParentId,
                to = l.ChildId,
                label = l.Condition
            })
            .ToListAsync();
            
        return Ok(new { nodes, edges, treeType });
    }

    /// <summary>
    /// Получить полную ветку решений для завершённой сессии
    /// Возвращает все вопросы, ответы и итоговый результат в виде древовидной структуры
    /// </summary>
    [HttpGet("{sessionId}/branch")]
    public async Task<ActionResult<SessionBranchDto>> GetSessionBranch(int sessionId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            return NotFound("Сессия не найдена");

        if (session.CompletedAt == null)
            return BadRequest("Сессия ещё не завершена");

        // Получаем путь в правильном порядке (от корня к результату)
        var pathIds = session.Path; // Это список ID узлов в порядке прохождения

        if (!pathIds.Any())
            return BadRequest("Путь сессии пуст");

        // Загружаем все узлы, которые были в пути
        var nodes = await context.Nodes
            .Where(n => pathIds.Contains(n.Id))
            .ToDictionaryAsync(n => n.Id);

        // Загружаем все связи, которые использовались
        var links = await context.Links
            .Where(l => pathIds.Contains(l.ParentId) && pathIds.Contains(l.ChildId))
            .ToListAsync();

        // Формируем структуру ветки
        var branch = new SessionBranchDto
        {
            SessionId = session.Id,
            ProjectName = session.ProjectName,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt.Value,
            Path = new List<PathItemDto>(),
            Result = new ResultDto
            {
                ArchitectureStyle = session.ResultNode?.ArchitectureStyle,
                Patterns = session.ResultNode?.Patterns ?? new List<string>(),
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

            var pathItem = new PathItemDto
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
            branch.Path.Add(new PathItemDto
            {
                NodeId = session.ResultNode.Id,
                Question = session.ResultNode.ArchitectureStyle,
                Type = "Answer",
                IsResult = true
            });
        }

        return Ok(branch);
    }

    // DTO для ответа
    public class SessionBranchDto
    {
        public int SessionId { get; set; }
        public string ProjectName { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime CompletedAt { get; set; }
        public List<PathItemDto> Path { get; set; }
        public ResultDto Result { get; set; }
    }

    public class PathItemDto
    {
        public int NodeId { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
        public string Type { get; set; } // "Question" или "Answer"
        public int? LeadsToNodeId { get; set; }
        public string LeadsToArchitecture { get; set; }
        public bool IsResult { get; set; }
    }

    public class ResultDto
    {
        public string ArchitectureStyle { get; set; }
        public List<string> Patterns { get; set; }
        public string Description { get; set; }
        public List<string> Pros { get; set; }
        public List<string> Cons { get; set; }
    }

    [HttpGet("{sessionId}/tree")]
    public async Task<ActionResult<QuestionNodeDto>> GetSessionTree(int sessionId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var session = await context.Sessions
            .Include(s => s.ResultNode)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            return NotFound("Сессия не найдена");

        if (session.CompletedAt == null)
            return BadRequest("Сессия ещё не завершена");

        var pathIds = session.Path;
        var nodes = await context.Nodes
            .Where(n => pathIds.Contains(n.Id))
            .ToDictionaryAsync(n => n.Id);

        // Рекурсивно строим дерево
        var rootNode = await BuildQuestionTree(nodes, session, pathIds[0], 0);

        return Ok(new
        {
            SessionId = session.Id,
            ProjectName = session.ProjectName,
            Tree = rootNode,
            Result = new
            {
                ArchitectureStyle = session.ResultNode?.ArchitectureStyle,
                Patterns = session.ResultNode?.Patterns,
                Description = session.ResultNode?.Description
            }
        });
    }

    private async Task<QuestionNodeDto> BuildQuestionTree(
        Dictionary<int, Node> nodes,
        Session session,
        int currentNodeId,
        int depth)
    {
        var node = nodes[currentNodeId];

        var dto = new QuestionNodeDto
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

    public class QuestionNodeDto
    {
        public int NodeId { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
        public QuestionNodeDto NextNode { get; set; }
    }
}