using ArchX.Server.Entities;

namespace ArchX.Server.Features.ArchitectureDecision;

public class SessionResponse
{
    public int Id { get; set; }
    public TreeType TreeType { get; set; }
    public string? CurrentQuestion { get; set; }
    public List<string>? Options { get; set; }
    public bool Completed { get; set; }
    public ResultNodeResponse? Result { get; set; }
    public bool IsStyleSelected { get; set; }
}

public class ResultNodeResponse
{
    public string? ArchitectureStyle { get; set; }
    public List<string>? Patterns { get; set; }
    public string? Description { get; set; }
    public List<string>? Pros { get; set; }
    public List<string>? Cons { get; set; }
}