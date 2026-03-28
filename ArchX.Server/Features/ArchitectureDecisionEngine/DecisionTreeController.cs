using System.Security.Claims;
using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Request;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.ArchitectureDecision;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DecisionTreeController(DecisionTreeService service) : ControllerBase
{
    private long? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(sub, out var id) ? id : null;
    }

    private bool IsUserRole() => User.IsInRole("User") && !User.IsInRole("Admin");

    [HttpPost("Get")]
    public async Task<IActionResult> GetSessions([FromBody] QueryParameter query)
    {
        var userIdFilter = IsUserRole() ? GetCurrentUserId() : null;
        var session = await service.GetSessionsAsync(query, userIdFilter);
        return Ok(session);
    }

    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var userIdFilter = IsUserRole() ? GetCurrentUserId() : null;
        var session = await service.GetSessionAsync(sessionId, userIdFilter);
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
            var patterns = await service.GetAggregatedPatternsForCompletedSessionAsync(
                session.Path,
                session.ResultNodeId);
            return Ok(new
            {
                Id = session.Id,
                Completed = true,
                TreeType = session.TreeType,
                ArchitectureStyle = resultNode.ArchitectureStyle,
                Patterns = patterns,
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
        var userIdFilter = IsUserRole() ? GetCurrentUserId() : null;
        var result = await service.GetSessionTree(sessionId, userIdFilter);
        return Ok(result);
    }

    [HttpGet("{sessionId}/tree/combined")]
    public async Task<IActionResult> GetCombinedSessionTree(int sessionId)
    {
        var userIdFilter = IsUserRole() ? GetCurrentUserId() : null;
        var result = await service.GetCombinedSessionTree(sessionId, userIdFilter);
        return Ok(result);
    }
}