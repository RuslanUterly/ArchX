namespace ArchX.Server.Features.Shared.Response;

public class PagedResult<T>
{
    public int TotalCount { get; set; }
    public List<T> Items { get; set; } = new List<T>();
}

