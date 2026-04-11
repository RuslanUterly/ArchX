using ArchX.Server.Entities;

namespace ArchX.Server.Features.ArchitectureDecisionEditor;

public class UpdateLinkRequest
{
    public int? NewChildId { get; set; }
    public string? NewCondition { get; set; }
}

public class InsertNodeRequest
{
    public NodeRequest Node { get; set; }
    public int? InsertAfterNodeId { get; set; } // Вставить после этого узла (для вопроса)
    public int? InsertAsChildOfNodeId { get; set; } // Вставить как дочерний для этого узла
    public string? ParentAnswerCondition { get; set; } // Условие для связи с родителем
    public bool InsertAsBranch { get; set; } // Вставить как альтернативную ветку
}

public class UpdateNodeRequest
{
    public int NodeId { get; set; }
    public NodeRequest Node { get; set; }
}

public class MoveNodeRequest
{
    public int NodeId { get; set; }
    public int NewParentId { get; set; }
    public string NewCondition { get; set; }
    public int? Position { get; set; } // Опционально: позиция среди siblings
}

public class NodeRequest
{
    public int? Id { get; set; } // null для новых узлов
    public TreeType TreeType { get; set; }
    public string Type { get; set; } // "Question" или "Result"
    public string? QuestionText { get; set; }
    public string? ArchitectureStyle { get; set; }
    public List<string>? Patterns { get; set; }
    public string? Description { get; set; }
    public List<string>? Pros { get; set; }
    public List<string>? Cons { get; set; }
}

public class LinkRequest
{
    public int? Id { get; set; }
    public int ParentId { get; set; }
    public int ChildId { get; set; }
    public string Condition { get; set; }
}