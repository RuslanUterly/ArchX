using ArchX.Server.Entities;

namespace ArchX.Server.Features.ArchitectureDecision;

public class StartSessionRequest
{
    public string ProjectName { get; set; }
    public TreeType TreeType { get; set; } = TreeType.ArchitectureStyle;
}

public class AnswerRequest
{
    public string Answer { get; set; }
}
