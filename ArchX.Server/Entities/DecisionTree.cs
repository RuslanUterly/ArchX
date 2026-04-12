using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ArchX.Server.Entities;

public enum NodeType
{
    Question = 1,
    Answer = 2,
}

public enum TreeType
{
    ArchitectureStyle = 1,
    MonolithPatterns = 2, 
    ModularMonolithPatterns = 3, 
    MicroservicesPatterns = 4 
}

/// <summary>
/// Узел дерева решений (вопрос или ответ)
/// </summary>
public class Node
{
    [Key]
    public int Id { get; set; }

    [Required]
    public TreeType TreeType { get; set; } // Тип дерева

    [Required]
    public string Type { get; set; } = "Question"; // "Question" или "Answer"
    public NodeType Type1 { get; set; } = NodeType.Question; // "Question" или "Answer"

    // Текст вопроса (для Question)
    public string? QuestionText { get; set; }

    // Для Answer – результат
    public string? ArchitectureStyle { get; set; }

    // Список паттернов (храним как JSON-строку)
    public string? PatternsJson { get; set; }

    // Дополнительные поля (описание, плюсы, минусы и т.д.)
    public string? Description { get; set; }
    public string? ProsJson { get; set; }
    public string? ConsJson { get; set; }

    // Навигационные свойства (связи)
    public ICollection<Link> OutgoingLinks { get; set; } = new List<Link>();
    public ICollection<Link> IncomingLinks { get; set; } = new List<Link>();

    // Вспомогательные свойства для работы с JSON
    [NotMapped]
    public List<string> Patterns
    {
        get => PatternsJson == null ? new List<string>() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(PatternsJson);
        set => PatternsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<string> Pros
    {
        get => ProsJson == null ? new List<string>() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(ProsJson);
        set => ProsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<string> Cons
    {
        get => ConsJson == null ? new List<string>() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(ConsJson);
        set => ConsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}

/// <summary>
/// Связь между узлами (ребро)
/// </summary>
public class Link
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ParentId { get; set; }
    public Node Parent { get; set; }

    [Required]
    public int ChildId { get; set; }
    public Node Child { get; set; }

    /// <summary>
    /// Условие перехода (ответ, например "Да", "≤ 5", "Низкая" и т.д.)
    /// </summary>
    [Required]
    public string Condition { get; set; }
}

/// <summary>
/// Сессия принятия решения (сохраняем историю)
/// </summary>
public class Session
{
    [Key]
    public int Id { get; set; }

    [Required]
    public TreeType TreeType { get; set; } // Тип дерева

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public string ProjectName { get; set; } // название проекта

    // Текущий узел (во время сессии)
    public int? CurrentNodeId { get; set; }
    public Node CurrentNode { get; set; }

    // Результат (заполняется после завершения)
    public int? ResultNodeId { get; set; }
    public Node ResultNode { get; set; }

    // История ответов (JSON: словарь "id узла" -> "ответ")
    public string AnswersJson { get; set; } = "{}";

    // История пройденных узлов (JSON: список id)
    public string PathJson { get; set; } = "[]";

    public long UserId { get; set; }      // идентификатор пользователя (можно из Identity)
    public User User { get; set; }

    public ICollection<FeedbackTicket> FeedbackTickets { get; set; } = new List<FeedbackTicket>();

    // Для хранения результата первого дерева, если нужно перейти ко второму
    public int? SelectedStyleNodeId { get; set; }
    public bool IsStyleSelected { get; set; }
    public bool IsHidden { get; set; }

    [NotMapped]
    public Dictionary<int, string> Answers
    {
        get => System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, string>>(AnswersJson) ?? new();
        set => AnswersJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<int> Path
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<int>>(PathJson) ?? new();
        set => PathJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}
