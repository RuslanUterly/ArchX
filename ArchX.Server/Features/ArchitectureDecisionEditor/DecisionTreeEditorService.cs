using ArchX.Server.Database;
using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.ArchitectureDecisionEditor;

public class DecisionTreeEditorService(IDbContextFactory<ArchXContext> dbFactory)
{
    /// <summary>
    /// Получить все узлы дерева с иерархией
    /// </summary>
    public async Task<List<NodeHierarchyResponse>> GetTreeHierarchyAsync(TreeType treeType)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        // Загружаем все узлы и связи для данного типа дерева
        var nodes = await context.Nodes
            .Where(n => n.TreeType == treeType)
            .ToDictionaryAsync(n => n.Id);

        var links = await context.Links
            .Where(l => nodes.Keys.Contains(l.ParentId) || nodes.Keys.Contains(l.ChildId))
            .ToListAsync();

        // Группируем связи по родителю
        var linksByParent = links
            .GroupBy(l => l.ParentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Находим корневые узлы (те, у которых нет входящих связей)
        var nodesWithIncomingLinks = links.Select(l => l.ChildId).ToHashSet();
        var rootNodes = nodes.Values
            .Where(n => !nodesWithIncomingLinks.Contains(n.Id))
            .ToList();

        // Строим иерархию
        var hierarchy = new List<NodeHierarchyResponse>();
        foreach (var root in rootNodes)
        {
            hierarchy.Add(BuildHierarchy(root, nodes, linksByParent));
        }

        return hierarchy;
    }

    private NodeHierarchyResponse BuildHierarchy(
        Node node,
        Dictionary<int, Node> allNodes,
        Dictionary<int, List<Link>> linksByParent)
    {
        var response = new NodeHierarchyResponse
        {
            Node = MapToDto(node),
            OutgoingLinks = new List<LinkRequest>(),
            Children = new List<NodeHierarchyResponse>()
        };

        // Получаем исходящие связи для текущего узла
        if (linksByParent.TryGetValue(node.Id, out var outgoingLinks))
        {
            foreach (var link in outgoingLinks)
            {
                // Добавляем информацию о связи
                response.OutgoingLinks.Add(new LinkRequest
                {
                    Id = link.Id,
                    ParentId = link.ParentId,
                    ChildId = link.ChildId,
                    Condition = link.Condition
                });

                // Рекурсивно строим иерархию для дочернего узла
                if (allNodes.TryGetValue(link.ChildId, out var childNode))
                {
                    var childHierarchy = BuildHierarchy(childNode, allNodes, linksByParent);
                    response.Children.Add(childHierarchy);
                }
            }
        }

        return response;
    }

    ///// <summary>
    ///// Получить все узлы дерева с иерархией
    ///// </summary>
    //public async Task<List<NodeHierarchyResponse>> GetTreeHierarchyAsync(TreeType treeType)
    //{
    //    using var context = await dbFactory.CreateDbContextAsync();

    //    var rootNodes = await context.Nodes
    //        .Include(n => n.OutgoingLinks)
    //        .ThenInclude(l => l.Child)
    //        .Where(n => n.TreeType == treeType && !n.IncomingLinks.Any())
    //        .ToListAsync();

    //    var hierarchy = new List<NodeHierarchyResponse>();
    //    foreach (var root in rootNodes)
    //    {
    //        hierarchy.Add(await BuildHierarchyAsync(root));
    //    }

    //    return hierarchy;
    //}

    //private async Task<NodeHierarchyResponse> BuildHierarchyAsync(Node node)
    //{
    //    var dto = new NodeHierarchyResponse
    //    {
    //        Node = MapToDto(node),
    //        OutgoingLinks = node.OutgoingLinks.Select(l => new LinkRequest
    //        {
    //            Id = l.Id,
    //            ParentId = l.ParentId,
    //            ChildId = l.ChildId,
    //            Condition = l.Condition
    //        }).ToList()
    //    };

    //    foreach (var link in node.OutgoingLinks)
    //    {
    //        if (link.Child != null)
    //        {
    //            var childHierarchy = await BuildHierarchyAsync(link.Child);
    //            dto.Children.Add(childHierarchy);
    //        }
    //    }

    //    return dto;
    //}

    /// <summary>
    /// Добавить новый узел в любое место дерева
    /// </summary>
    public async Task<Node> InsertNodeAsync(InsertNodeRequest request)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        // Создаем новый узел
        var newNode = new Node
        {
            TreeType = request.Node.TreeType,
            Type = request.Node.Type,
            QuestionText = request.Node.QuestionText,
            ArchitectureStyle = request.Node.ArchitectureStyle,
            Patterns = request.Node.Patterns,
            Description = request.Node.Description,
            Pros = request.Node.Pros,
            Cons = request.Node.Cons
        };

        context.Nodes.Add(newNode);
        await context.SaveChangesAsync(); // Сохраняем чтобы получить ID

        // Обрабатываем вставку в зависимости от параметров
        if (request.InsertAsChildOfNodeId.HasValue)
        {
            // Вставляем как дочерний узел
            await InsertAsChildAsync(context, newNode.Id,
                request.InsertAsChildOfNodeId.Value,
                request.ParentAnswerCondition);
        }
        else if (request.InsertAfterNodeId.HasValue)
        {
            // Вставляем после указанного узла (сдвигаем связи)
            await InsertAfterNodeAsync(context, newNode.Id,
                request.InsertAfterNodeId.Value,
                request.ParentAnswerCondition);
        }

        await context.SaveChangesAsync();
        return newNode;
    }

    /// <summary>
    /// Вставить узел как дочерний для указанного родителя
    /// </summary>
    private async Task InsertAsChildAsync(ArchXContext context, int newNodeId, int parentId, string condition)
    {
        // Проверяем, существует ли уже связь с таким условием
        var existingLink = await context.Links
            .FirstOrDefaultAsync(l => l.ParentId == parentId && l.Condition == condition);

        if (existingLink != null)
        {
            // Если связь существует, нужно сдвинуть существующую ветку
            // Создаем промежуточный узел если нужно
            throw new InvalidOperationException($"Связь с условием '{condition}' уже существует");
        }

        // Создаем новую связь
        var link = new Link
        {
            ParentId = parentId,
            ChildId = newNodeId,
            Condition = condition
        };

        context.Links.Add(link);
    }

    /// <summary>
    /// Вставить узел после указанного узла (в середину пути)
    /// </summary>
    private async Task InsertAfterNodeAsync(ArchXContext context, int newNodeId, int afterNodeId, string condition)
    {
        // Находим все связи, где afterNodeId является родителем
        var outgoingLinks = await context.Links
            .Where(l => l.ParentId == afterNodeId)
            .ToListAsync();

        // Сохраняем оригинальные связи
        var originalLinks = outgoingLinks.Select(l => new
        {
            l.ChildId,
            l.Condition
        }).ToList();

        // Удаляем оригинальные связи
        context.Links.RemoveRange(outgoingLinks);

        // Создаем связь от afterNodeId к newNodeId
        context.Links.Add(new Link
        {
            ParentId = afterNodeId,
            ChildId = newNodeId,
            Condition = condition ?? "Далее"
        });

        // Создаем связи от newNodeId ко всем оригинальным детям
        foreach (var original in originalLinks)
        {
            context.Links.Add(new Link
            {
                ParentId = newNodeId,
                ChildId = original.ChildId,
                Condition = original.Condition
            });
        }
    }

    /// <summary>
    /// Вставить новую ветку (альтернативный путь)
    /// </summary>
    public async Task<NodeResponse> InsertBranchAsync(int parentNodeId, string condition, NodeRequest branchRoot)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        // Проверяем, не существует ли уже такое условие
        var existingLink = await context.Links
            .FirstOrDefaultAsync(l => l.ParentId == parentNodeId && l.Condition == condition);

        if (existingLink != null)
        {
            throw new InvalidOperationException($"Ветка с условием '{condition}' уже существует");
        }

        // Создаем корневой узел новой ветки
        var branchRootNode = new Node
        {
            TreeType = branchRoot.TreeType,
            Type = branchRoot.Type,
            QuestionText = branchRoot.QuestionText,
            ArchitectureStyle = branchRoot.ArchitectureStyle,
            Patterns = branchRoot.Patterns,
            Description = branchRoot.Description,
            Pros = branchRoot.Pros,
            Cons = branchRoot.Cons
        };

        context.Nodes.Add(branchRootNode);
        await context.SaveChangesAsync();

        // Создаем связь от родителя к новому узлу
        context.Links.Add(new Link
        {
            ParentId = parentNodeId,
            ChildId = branchRootNode.Id,
            Condition = condition
        });

        await context.SaveChangesAsync();
        return new NodeResponse
        {
            Id = branchRootNode.Id,
            TreeType = branchRoot.TreeType,
            Type = branchRoot.Type,
            QuestionText = branchRoot.QuestionText,
            ArchitectureStyle = branchRoot.ArchitectureStyle,
            Patterns = branchRoot.Patterns,
            Description = branchRoot.Description,
            Pros = branchRoot.Pros,
            Cons = branchRoot.Cons
        };
    }

    /// <summary>
    /// Обновить существующий узел
    /// </summary>
    public async Task<Node> UpdateNodeAsync(UpdateNodeRequest request)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var node = await context.Nodes.FindAsync(request.NodeId);
        if (node == null)
            throw new NotFoundException($"Узел с ID {request.NodeId} не найден");

        // Обновляем поля
        node.QuestionText = request.Node.QuestionText;
        node.ArchitectureStyle = request.Node.ArchitectureStyle;
        node.Patterns = request.Node.Patterns;
        node.Description = request.Node.Description;
        node.Pros = request.Node.Pros;
        node.Cons = request.Node.Cons;

        // Type и TreeType обычно не меняем, но можно разрешить
        if (!string.IsNullOrEmpty(request.Node.Type))
            node.Type = request.Node.Type;

        await context.SaveChangesAsync();
        return node;
    }

    ///// <summary>
    ///// Переместить узел в другое место дерева
    ///// </summary>
    //public async Task MoveNodeAsync(MoveNodeRequest request)
    //{
    //    using var context = await dbFactory.CreateDbContextAsync();

    //    // Находим все входящие связи для узла
    //    var incomingLinks = await context.Links
    //        .Where(l => l.ChildId == request.NodeId)
    //        .ToListAsync();

    //    if (!incomingLinks.Any())
    //        throw new InvalidOperationException("Нельзя переместить корневой узел");

    //    // Удаляем старые входящие связи
    //    context.Links.RemoveRange(incomingLinks);

    //    // Создаем новую связь
    //    context.Links.Add(new Link
    //    {
    //        ParentId = request.NewParentId,
    //        ChildId = request.NodeId,
    //        Condition = request.NewCondition
    //    });

    //    // Если указана позиция, нужно переупорядочить siblings
    //    if (request.Position.HasValue)
    //    {
    //        await ReorderSiblingsAsync(context, request.NewParentId, request.NodeId, request.Position.Value);
    //    }

    //    await context.SaveChangesAsync();
    //}

    ///// <summary>
    ///// Переупорядочить дочерние узлы (если есть понятие порядка)
    ///// </summary>
    //private async Task ReorderSiblingsAsync(ArchXContext context, int parentId, int nodeId, int position)
    //{
    //    // Получаем все связи родителя
    //    var links = await context.Links
    //        .Where(l => l.ParentId == parentId)
    //        .OrderBy(l => l.Condition) // или по другому полю порядка
    //        .ToListAsync();

    //    // Здесь можно реализовать логику переупорядочивания
    //    // Например, добавить поле Order в Link и обновить его
    //}

    /// <summary>
    /// Удалить узел и все его поддерево
    /// </summary>
    public async Task DeleteNodeAsync(int nodeId, bool cascade = true)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var node = await context.Nodes
            .Include(n => n.IncomingLinks)
            .Include(n => n.OutgoingLinks)
            .FirstOrDefaultAsync(n => n.Id == nodeId);

        if (node == null)
            throw new NotFoundException($"Узел с ID {nodeId} не найден");

        if (node.IncomingLinks.Count == 0 && cascade == false)
        {
            throw new InvalidOperationException("Нельзя удалить корневой узел без cascade=true");
        }

        if (cascade)
        {
            // Рекурсивно удаляем все поддерево
            await DeleteSubtreeAsync(context, nodeId);
        }
        else
        {
            // Удаляем только узел, перенаправляем связи
            await DetachNodeAsync(context, node);
        }

        await context.SaveChangesAsync();
    }

    private async Task DeleteSubtreeAsync(ArchXContext context, int nodeId)
    {
        var node = await context.Nodes
            .Include(n => n.OutgoingLinks)
            .FirstOrDefaultAsync(n => n.Id == nodeId);

        if (node == null) return;

        // Рекурсивно удаляем всех детей
        foreach (var link in node.OutgoingLinks.ToList())
        {
            await DeleteSubtreeAsync(context, link.ChildId);
        }

        // Удаляем связи
        context.Links.RemoveRange(node.IncomingLinks);
        context.Links.RemoveRange(node.OutgoingLinks);

        // Удаляем сам узел
        context.Nodes.Remove(node);
    }

    private async Task DetachNodeAsync(ArchXContext context, Node node)
    {
        // Перенаправляем все входящие связи на первого ребенка или удаляем
        var firstChild = node.OutgoingLinks.FirstOrDefault();

        if (firstChild != null)
        {
            // Перенаправляем все входящие связи на первого ребенка
            foreach (var incoming in node.IncomingLinks.ToList())
            {
                context.Links.Add(new Link
                {
                    ParentId = incoming.ParentId,
                    ChildId = firstChild.ChildId,
                    Condition = incoming.Condition
                });
            }
        }

        // Удаляем узел и его связи
        context.Links.RemoveRange(node.IncomingLinks);
        context.Links.RemoveRange(node.OutgoingLinks);
        context.Nodes.Remove(node);
    }

    /// <summary>
    /// Добавить новую связь между существующими узлами
    /// </summary>
    public async Task<Link> AddLinkAsync(int parentId, int childId, string condition)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        // Проверяем, не существует ли уже такая связь
        var existing = await context.Links
            .FirstOrDefaultAsync(l => l.ParentId == parentId && l.Condition == condition);

        if (existing != null)
            throw new InvalidOperationException($"Связь с условием '{condition}' уже существует");

        var link = new Link
        {
            ParentId = parentId,
            ChildId = childId,
            Condition = condition
        };

        context.Links.Add(link);
        await context.SaveChangesAsync();

        return link;
    }

    /// <summary>
    /// Обновить существующую связь
    /// </summary>
    public async Task<Link> UpdateLinkAsync(int linkId, int? newChildId, string? newCondition)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var link = await context.Links.FindAsync(linkId);
        if (link == null)
            throw new NotFoundException($"Связь с ID {linkId} не найдена");

        if (newChildId.HasValue)
            link.ChildId = newChildId.Value;

        if (!string.IsNullOrEmpty(newCondition))
        {
            // Проверяем уникальность условия для родителя
            var existing = await context.Links
                .FirstOrDefaultAsync(l => l.ParentId == link.ParentId &&
                                         l.Condition == newCondition &&
                                         l.Id != linkId);

            if (existing != null)
                throw new InvalidOperationException($"Связь с условием '{newCondition}' уже существует");

            link.Condition = newCondition;
        }

        await context.SaveChangesAsync();
        return link;
    }

    /// <summary>
    /// Удалить связь
    /// </summary>
    public async Task DeleteLinkAsync(int linkId)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var link = await context.Links.FindAsync(linkId);
        if (link == null)
            throw new NotFoundException($"Связь с ID {linkId} не найдена");

        context.Links.Remove(link);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Клонировать ветку (для переиспользования)
    /// </summary>
    public async Task<int> CloneSubtreeAsync(int rootNodeId, int newParentId, string newCondition)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var rootNode = await context.Nodes
            .Include(n => n.OutgoingLinks)
            .ThenInclude(l => l.Child)
            .FirstOrDefaultAsync(n => n.Id == rootNodeId);

        if (rootNode == null)
            throw new NotFoundException($"Узел {rootNodeId} не найден");

        // Клонируем поддерево
        var nodeIdMapping = new Dictionary<int, int>();
        var newRootId = await CloneNodeAsync(context, rootNode, nodeIdMapping);

        // Создаем связь с новым родителем
        context.Links.Add(new Link
        {
            ParentId = newParentId,
            ChildId = newRootId,
            Condition = newCondition
        });

        await context.SaveChangesAsync();
        return newRootId;
    }

    private async Task<int> CloneNodeAsync(ArchXContext context, Node sourceNode, Dictionary<int, int> idMapping)
    {
        // Создаем копию узла
        var newNode = new Node
        {
            TreeType = sourceNode.TreeType,
            Type = sourceNode.Type,
            QuestionText = sourceNode.QuestionText,
            ArchitectureStyle = sourceNode.ArchitectureStyle,
            Patterns = sourceNode.Patterns,
            Description = sourceNode.Description,
            Pros = sourceNode.Pros,
            Cons = sourceNode.Cons
        };

        context.Nodes.Add(newNode);
        await context.SaveChangesAsync(); // Получаем ID

        idMapping[sourceNode.Id] = newNode.Id;

        // Клонируем всех детей
        foreach (var link in sourceNode.OutgoingLinks)
        {
            var childId = await CloneNodeAsync(context, link.Child, idMapping);

            context.Links.Add(new Link
            {
                ParentId = newNode.Id,
                ChildId = childId,
                Condition = link.Condition
            });
        }

        return newNode.Id;
    }

    /// <summary>
    /// Экспортировать дерево в JSON
    /// </summary>
    public async Task<string> ExportTreeAsync(TreeType treeType)
    {
        var hierarchy = await GetTreeHierarchyAsync(treeType);
        return System.Text.Json.JsonSerializer.Serialize(hierarchy, new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = true
        });
    }

    /// <summary>
    /// Импортировать дерево из JSON
    /// </summary>
    public async Task ImportTreeAsync(string json, TreeType treeType, bool merge = false)
    {
        if (!merge)
        {
            using var context = await dbFactory.CreateDbContextAsync();
            // Удаляем существующее дерево
            var nodes = await context.Nodes.Where(n => n.TreeType == treeType).ToListAsync();
            context.Nodes.RemoveRange(nodes);
            await context.SaveChangesAsync();
        }

        var hierarchy = System.Text.Json.JsonSerializer.Deserialize<List<NodeHierarchyResponse>>(json);
        if (hierarchy == null) return;

        using var context2 = await dbFactory.CreateDbContextAsync();
        foreach (var root in hierarchy)
        {
            await ImportNodeAsync(context2, root, null, null);
        }
        await context2.SaveChangesAsync();
    }

    private async Task ImportNodeAsync(ArchXContext context, NodeHierarchyResponse dto, int? parentId, string? condition)
    {
        var node = new Node
        {
            TreeType = dto.Node.TreeType,
            Type = dto.Node.Type,
            QuestionText = dto.Node.QuestionText,
            ArchitectureStyle = dto.Node.ArchitectureStyle,
            Patterns = dto.Node.Patterns,
            Description = dto.Node.Description,
            Pros = dto.Node.Pros,
            Cons = dto.Node.Cons
        };

        context.Nodes.Add(node);
        await context.SaveChangesAsync();

        if (parentId.HasValue && condition != null)
        {
            context.Links.Add(new Link
            {
                ParentId = parentId.Value,
                ChildId = node.Id,
                Condition = condition
            });
        }

        foreach (var child in dto.Children)
        {
            var childLink = dto.OutgoingLinks.FirstOrDefault(l => l.ChildId == child.Node.Id);
            await ImportNodeAsync(context, child, node.Id, childLink?.Condition);
        }
    }

    private NodeRequest MapToDto(Node node)
    {
        return new NodeRequest
        {
            Id = node.Id,
            TreeType = node.TreeType,
            Type = node.Type,
            QuestionText = node.QuestionText,
            ArchitectureStyle = node.ArchitectureStyle,
            Patterns = node.Patterns,
            Description = node.Description,
            Pros = node.Pros,
            Cons = node.Cons
        };
    }
}
