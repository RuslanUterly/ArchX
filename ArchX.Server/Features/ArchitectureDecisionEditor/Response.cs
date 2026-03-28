using ArchX.Server.Entities;

namespace ArchX.Server.Features.ArchitectureDecisionEditor;

public class NodeHierarchyResponse
{
    public NodeRequest Node { get; set; }
    public List<NodeHierarchyResponse> Children { get; set; } = new();
    public List<LinkRequest> OutgoingLinks { get; set; } = new();
}

public class NodeResponse
{
    public int Id { get; set; }
    public TreeType TreeType { get; set; }
    public string Type { get; set; }
    public string? QuestionText { get; set; }
    public string? ArchitectureStyle { get; set; }
    public List<string>? Patterns { get; set; }
    public string? Description { get; set; }
    public List<string>? Pros { get; set; }
    public List<string>? Cons { get; set; }
}

public class LinkResponse
{
    public int? Id { get; set; }
    public int ParentId { get; set; }
    public int ChildId { get; set; }
    public string Condition { get; set; }
}
