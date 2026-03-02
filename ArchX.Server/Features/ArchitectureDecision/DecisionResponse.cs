using ArchX.Server.Entities;

namespace ArchX.Server.Features.ArchitectureDecision;

public class SessionResponse
{
    public int Id { get; set; }
    public TreeType TreeType { get; set; }
    public string CurrentQuestion { get; set; }
    public List<string> Options { get; set; }
    public bool Completed { get; set; }
    public object Result { get; set; }
    public bool IsStyleSelected { get; set; }
}