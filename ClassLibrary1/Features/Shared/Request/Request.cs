namespace ArchX.Server.Features.Shared.Request;

public class QueryParameter
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public string? SortField { get; set; }
    public string? SortOrder { get; set; }
}
