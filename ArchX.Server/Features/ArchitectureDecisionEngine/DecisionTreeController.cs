using ArchX.Server.Database;
using ArchX.Server.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.ArchitectureDecision;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DecisionTreeController(DecisionTreeService service, IDbContextFactory<ArchXContext> dbFactory) : ControllerBase
{
    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var session = await service.GetSessionAsync(sessionId);
        return Ok(session);
    }

    [HttpPost("start/{userId}")]
    public async Task<IActionResult> StartSession(long userId, [FromBody] StartSessionRequest request)
    {
        var session = await service.StartSessionAsync(userId, request.ProjectName, request.TreeType);

        return Ok(await service.GetSessionAsync(session.Id));
    }

    [HttpPost("{styleSessionId}/continue-with-patterns")]
    public async Task<IActionResult> ContinueWithPatterns(int styleSessionId)
    {
        var session = await service.ContinueWithPatternsAsync(styleSessionId);

        return Ok(await service.GetSessionAsync(session.Id));
    }

    [HttpPost("{sessionId}/answer")]
    public async Task<IActionResult> PostAnswer(int sessionId, [FromBody] AnswerRequest request)
    {
        var session = await service.ProcessAnswerAsync(sessionId, request.Answer);

        if (session.CompletedAt != null)
        {
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
            return Ok(await service.GetSessionAsync(session.Id));
        }
    }

    [HttpGet("visualization/{treeType}")]
    public async Task<IActionResult> GetVisualization(TreeType treeType)
    {
        var result = await service.GetVisualization(treeType);
        return Ok(result);
    }

    [HttpGet("{sessionId}/branch")]
    public async Task<IActionResult> GetSessionBranch(int sessionId)
    {
        var result = await service.GetSessionBranch(sessionId);
        return Ok(result);
    }

    [HttpGet("{sessionId}/tree")]
    public async Task<IActionResult> GetSessionTree(int sessionId)
    {
        var result = await service.GetSessionTree(sessionId);
        return Ok(result);
    }
}