using ArchX.Server.Entities;

namespace ArchX.Server.Features.ArchitectureDecision;

public abstract class SessionResponseBase
{
    public int Id { get; set; }
    public TreeType TreeType { get; set; }
    public NodeResponseBase? Result { get; set; }
}

public class SessionInProccessResponse : SessionResponseBase
{
    public string? CurrentQuestion { get; set; }
    public List<string>? Options { get; set; }
    public bool Completed { get; set; }
    public bool IsStyleSelected { get; set; }
}

public class SessionCompleteResponse : SessionResponseBase
{
    public string ProjectName { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public int? SelectedStyleNodeId { get; set; }
}

public abstract class NodeResponseBase
{
    public string? ArchitectureStyle { get; set; }
    public List<string>? Patterns { get; set; }
    public string? Description { get; set; }
}

public class ResultNodeInProccessResponse : NodeResponseBase
{
    public List<string>? Pros { get; set; }
    public List<string>? Cons { get; set; }
}

public class ResultNodeCompletedResponse : NodeResponseBase
{
    public List<string>? Pros { get; set; }
    public List<string>? Cons { get; set; }
}

public class NodeResponse
{
    public long Id { get; set; }
    public string? Label { get; set; }
    public string? Type { get; set; }
    public string? Description { get; set; }
    public List<string>? Patterns { get; set; }
}

public class LinkResponse
{
    public int From { get; set; }
    public int To { get; set; }
    public string? Label { get; set; }
}

public class VisualizationResponse
{
    public List<NodeResponse> Nodes { get; set; }
    public List<LinkResponse> Edges { get; set; }
    public TreeType TreeType { get; set; }
}

public class SessionBranchResponse
{
    public int SessionId { get; set; }
    public string ProjectName { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public List<PathItemResponse> Path { get; set; }
    public NodeResponseBase Result { get; set; }
}

public class PathItemResponse
{
    public int NodeId { get; set; }
    public string Question { get; set; }
    public string Answer { get; set; }
    public string Type { get; set; } // "Question" или "Answer"
    public int? LeadsToNodeId { get; set; }
    public string LeadsToArchitecture { get; set; }
    public bool IsResult { get; set; }
}

public class SessionTreeResponse
{
    public int SessionId { get; set; }
    public string ProjectName { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public QuestionNodeResponse Tree { get; set; }
    public ResultNodeInProccessResponse? Result { get; set; }
}

public class QuestionNodeResponse
{
    public int NodeId { get; set; }
    public string? Question { get; set; }
    public string? Answer { get; set; }
    public QuestionNodeResponse? NextNode { get; set; }
}

/// <summary>
/// Объединённое дерево: сессия по стилям (опционально) + сессия по паттернам (опционально).
/// Для сессии только по стилям — только StyleTree.
/// Для сессии по паттернам — оба дерева (родительская сессия стилей + текущая сессия паттернов).
/// </summary>
public class CombinedSessionTreeResponse
{
    public SessionTreeResponse? StyleTree { get; set; }
    public SessionTreeResponse? PatternsTree { get; set; }
}