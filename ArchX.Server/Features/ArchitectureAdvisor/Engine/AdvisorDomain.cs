
namespace ArchX.Server.Features.ArchitectureAdvisor.Engine;

/// <summary>
/// Характеристики проекта (входные данные)
/// </summary>
public class ProjectCharacteristics
{
    public int TeamSize { get; set; } // Размер команды
    public bool RequiresACID { get; set; } // Нужны ли ACID транзакции
    public string ProjectType { get; set; } // "Startup", "Enterprise", "MVP"
    public int ExpectedUsers { get; set; } // Ожидаемое количество пользователей
    public string DeploymentModel { get; set; } // "OnPremise", "Cloud", "Hybrid"
    public bool DifferentScalingNeeds { get; set; } // Разные требования к масштабированию модулей
    public int DevelopmentTime { get; set; } // Время на разработку в месяцах
    public string TeamExperience { get; set; } // "Junior", "Middle", "Senior"
    public bool RequiresIndependentDeployment { get; set; } // Нужен ли независимый деплой
    public bool RequiresPolyglotPersistence { get; set; } // Нужны ли разные БД
}

/// <summary>
/// Результат рекомендации
/// </summary>
public class ArchitectureRecommendation
{
    public string ArchitectureStyle { get; set; }
    public List<string> Patterns { get; set; }
    public Dictionary<string, double> ConfidenceFactors { get; set; }
    public List<string> Warnings { get; set; }
    public List<string> Recommendations { get; set; }
}

/// <summary>
/// Архитектурный стиль
/// </summary>
public class ArchitectureStyle
{
    public string Name { get; set; }
    public string Description { get; set; }
    public List<string> WhenToUse { get; set; }
    public List<string> WhenNotToUse { get; set; }
    public List<string> SuitablePatterns { get; set; }
    public List<Requirement> Requirements { get; set; }
}

public class Requirement
{
    public string Name { get; set; }
    public string Condition { get; set; }
    public int Weight { get; set; }
}
