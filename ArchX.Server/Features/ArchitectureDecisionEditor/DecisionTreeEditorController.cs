using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.ArchitectureDecisionEditor;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "Admin")]
public class DecisionTreeEditorController(DecisionTreeEditorService editorService) : ControllerBase
{
    /// <summary>
    /// Получить иерархию дерева
    /// </summary>
    [HttpGet("tree/{treeType}/hierarchy")]
    public async Task<IActionResult> GetTreeHierarchy(TreeType treeType)
    {
        var hierarchy = await editorService.GetTreeHierarchyAsync(treeType);
        return Ok(hierarchy);
    }

    /// <summary>
    /// Вставить новый узел
    /// </summary>
    [HttpPost("nodes/insert")]
    public async Task<IActionResult> InsertNode([FromBody] InsertNodeRequest request)
    {
        try
        {
            var node = await editorService.InsertNodeAsync(request);
            return Ok(node);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }
    }

    /// <summary>
    /// Вставить новую ветку
    /// </summary>
    [HttpPost("nodes/{parentNodeId}/branch")]
    public async Task<IActionResult> InsertBranch(int parentNodeId, [FromQuery] string condition, [FromBody] NodeRequest branchRoot)
    {
        try
        {
            var node = await editorService.InsertBranchAsync(parentNodeId, condition, branchRoot);
            return Ok(node);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }
    }

    /// <summary>
    /// Обновить узел
    /// </summary>
    [HttpPut("nodes/{nodeId}")]
    public async Task<IActionResult> UpdateNode(int nodeId, [FromBody] NodeRequest nodeDto)
    {
        var request = new UpdateNodeRequest
        {
            NodeId = nodeId,
            Node = nodeDto
        };

        var node = await editorService.UpdateNodeAsync(request);
        return Ok(node);
    }

    /// <summary>
    /// Переместить узел
    /// </summary>
    //[HttpPost("nodes/{nodeId}/move")]
    //public async Task<IActionResult> MoveNode(int nodeId, [FromBody] MoveNodeRequest request)
    //{
    //    request.NodeId = nodeId;

    //    try
    //    {
    //        await _editorService.MoveNodeAsync(request);
    //        return Ok();
    //    }
    //    catch (InvalidOperationException ex)
    //    {
    //        return BadRequest(ex.Message);
    //    }
    //}

    /// <summary>
    /// Удалить узел
    /// </summary>
    [HttpDelete("nodes/{nodeId}")]
    public async Task<IActionResult> DeleteNode(int nodeId, [FromQuery] bool cascade = true)
    {
        try
        {
            await editorService.DeleteNodeAsync(nodeId, cascade);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }
    }

    /// <summary>
    /// Добавить связь
    /// </summary>
    [HttpPost("links")]
    public async Task<IActionResult> AddLink([FromBody] LinkRequest linkDto)
    {
        try
        {
            var link = await editorService.AddLinkAsync(linkDto.ParentId, linkDto.ChildId, linkDto.Condition);
            return Ok(link);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }
    }

    /// <summary>
    /// Обновить связь
    /// </summary>
    [HttpPut("links/{linkId}")]
    public async Task<IActionResult> UpdateLink(int linkId, [FromBody] UpdateLinkRequest request)
    {
        try
        {
            var link = await editorService.UpdateLinkAsync(linkId, request.NewChildId, request.NewCondition);
            return Ok(link);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }
    }

    /// <summary>
    /// Удалить связь
    /// </summary>
    [HttpDelete("links/{linkId}")]
    public async Task<IActionResult> DeleteLink(int linkId)
    {
        await editorService.DeleteLinkAsync(linkId);
        return Ok();
    }

    /// <summary>
    /// Клонировать ветку
    /// </summary>
    [HttpPost("nodes/{nodeId}/clone")]
    public async Task<IActionResult> CloneSubtree(int nodeId, int newParentId, string newCondition)
    {
        var newRootId = await editorService.CloneSubtreeAsync(nodeId, newParentId, newCondition);
        return Ok(new { NewRootId = newRootId });
    }

    /// <summary>
    /// Экспортировать дерево
    /// </summary>
    [HttpGet("tree/{treeType}/export")]
    public async Task<IActionResult> ExportTree(TreeType treeType)
    {
        var json = await editorService.ExportTreeAsync(treeType);
        return Content(json, "application/json");
    }

    /// <summary>
    /// Импортировать дерево
    /// </summary>
    [HttpPost("tree/{treeType}/import")]
    public async Task<IActionResult> ImportTree(TreeType treeType, [FromBody] string json, [FromQuery] bool merge = false)
    {
        await editorService.ImportTreeAsync(json, treeType, merge);
        return Ok();
    }
}