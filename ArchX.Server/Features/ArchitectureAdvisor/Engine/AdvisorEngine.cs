namespace ArchX.Server.Features.ArchitectureAdvisor.Engine;

/// <summary>
/// Правило выбора архитектуры
/// </summary>
public class SelectionRule
{
    public string Id { get; set; }
    public string ArchitectureStyle { get; set; }
    public string Description { get; set; }
    public int Priority { get; set; } // Приоритет правила

    // Условие в виде C# выражения
    public Func<ProjectCharacteristics, bool> Condition { get; set; }

    // Вес правила (влияние на итоговую оценку)
    public int Weight { get; set; }

    public string Explanation { get; set; } // Человеко-понятное объяснение
}

/// <summary>
/// Движок вывода (inference engine)
/// </summary>
public class ArchitectureAdvisorEngine
{
    private readonly List<SelectionRule> _rules;
    private readonly List<ArchitectureStyle> _styles;

    public ArchitectureAdvisorEngine()
    {
        _styles = LoadArchitectureStyles();
        _rules = LoadSelectionRules();
    }

    /// <summary>
    /// Загрузка базы знаний об архитектурных стилях
    /// </summary>
    private List<ArchitectureStyle> LoadArchitectureStyles()
    {
        return new List<ArchitectureStyle>
        {
            new ArchitectureStyle
            {
                Name = "Монолит",
                Description = "Традиционное единое приложение",
                WhenToUse = new List<string>
                {
                    "Небольшая команда (2-5 человек)",
                    "MVP или прототип",
                    "Простой домен",
                    "Стартап на ранней стадии"
                },
                WhenNotToUse = new List<string>
                {
                    "Команда > 10 человек",
                    "Требуется независимый деплой модулей",
                    "Разные технологии для разных модулей"
                },
                SuitablePatterns = new List<string> { "MVC", "三层架构" }
            },
            new ArchitectureStyle
            {
                Name = "Модульный монолит",
                Description = "Монолит с четким разделением на модули",
                WhenToUse = new List<string>
                {
                    "Команда 5-50 человек",
                    "Сложный домен с четкими границами",
                    "Требуются ACID транзакции",
                    "Средний и крупный бизнес"
                },
                WhenNotToUse = new List<string>
                {
                    "Требуется независимое масштабирование модулей",
                    "Разные команды должны деплоить независимо"
                },
                SuitablePatterns = new List<string> { "DDD", "Чистая архитектура", "CQRS" }
            },
            new ArchitectureStyle
            {
                Name = "Микросервисы",
                Description = "Набор независимых сервисов",
                WhenToUse = new List<string>
                {
                    "Большая команда (> 50 человек)",
                    "Разные требования к масштабированию",
                    "Независимый жизненный цикл модулей",
                    "Polyglot persistence",
                    "High scalability requirements"
                },
                WhenNotToUse = new List<string>
                {
                    "Стартап на ранней стадии",
                    "Строгие требования к ACID",
                    "Небольшая команда",
                    "Сжатые сроки"
                },
                SuitablePatterns = new List<string> { "API Gateway", "CQRS", "Event Sourcing", "Saga" }
            },
            new ArchitectureStyle
            {
                Name = "SOA",
                Description = "Сервис-ориентированная архитектура",
                WhenToUse = new List<string>
                {
                    "Крупное предприятие",
                    "Интеграция разнородных систем",
                    "Существующие legacy системы",
                    "Строгая governance"
                },
                WhenNotToUse = new List<string>
                {
                    "Greenfield проект",
                    "Облачная среда",
                    "Небольшая команда"
                },
                SuitablePatterns = new List<string> { "ESB", "BPEL", "WS-*" }
            }
        };
    }

    /// <summary>
    /// Загрузка правил выбора
    /// </summary>
    private List<SelectionRule> LoadSelectionRules()
    {
        return new List<SelectionRule>
        {
            // Правила для монолита
            new SelectionRule
            {
                Id = "MONO-1",
                ArchitectureStyle = "Монолит",
                Priority = 10,
                Weight = 5,
                Condition = (p) => p.TeamSize <= 5,
                Explanation = "Маленькая команда (до 5 человек) лучше работает с монолитом"
            },
            new SelectionRule
            {
                Id = "MONO-2",
                ArchitectureStyle = "Монолит",
                Priority = 8,
                Weight = 4,
                Condition = (p) => p.ProjectType == "MVP" || p.ProjectType == "Startup",
                Explanation = "MVP и стартапы требуют быстрой разработки, монолит оптимален"
            },
            new SelectionRule
            {
                Id = "MONO-3",
                ArchitectureStyle = "Монолит",
                Priority = 6,
                Weight = 3,
                Condition = (p) => p.DevelopmentTime < 3,
                Explanation = "При сжатых сроках монолит позволяет быстрее выпустить продукт"
            },
            
            // Правила для модульного монолита
            new SelectionRule
            {
                Id = "MOD-1",
                ArchitectureStyle = "Модульный монолит",
                Priority = 10,
                Weight = 5,
                Condition = (p) => p.TeamSize > 5 && p.TeamSize <= 50 && p.RequiresACID,
                Explanation = "Команда среднего размера, нужны ACID транзакции - идеально для модульного монолита"
            },
            new SelectionRule
            {
                Id = "MOD-2",
                ArchitectureStyle = "Модульный монолит",
                Priority = 8,
                Weight = 4,
                Condition = (p) => p.RequiresACID && !p.DifferentScalingNeeds,
                Explanation = "ACID транзакции важны, масштабирование равномерное"
            },
            
            // Правила для микросервисов
            new SelectionRule
            {
                Id = "MICRO-1",
                ArchitectureStyle = "Микросервисы",
                Priority = 10,
                Weight = 5,
                Condition = (p) => p.TeamSize > 50 && p.DifferentScalingNeeds,
                Explanation = "Большая команда с разными требованиями к масштабированию"
            },
            new SelectionRule
            {
                Id = "MICRO-2",
                ArchitectureStyle = "Микросервисы",
                Priority = 9,
                Weight = 4,
                Condition = (p) => p.RequiresIndependentDeployment,
                Explanation = "Требуется независимый деплой - микросервисы обязательны"
            },
            new SelectionRule
            {
                Id = "MICRO-3",
                ArchitectureStyle = "Микросервисы",
                Priority = 7,
                Weight = 3,
                Condition = (p) => p.RequiresPolyglotPersistence,
                Explanation = "Разные БД для разных задач"
            }
        };
    }

    /// <summary>
    /// Получить рекомендацию
    /// </summary>
    public ArchitectureRecommendation GetRecommendation(ProjectCharacteristics project)
    {
        // Оценка каждого архитектурного стиля
        var scores = new Dictionary<string, double>();
        var explanations = new Dictionary<string, List<string>>();

        foreach (var style in _styles)
        {
            var applicableRules = _rules.Where(r => r.ArchitectureStyle == style.Name);
            double score = 0;
            var styleExplanations = new List<string>();

            foreach (var rule in applicableRules)
            {
                if (rule.Condition(project))
                {
                    score += rule.Weight;
                    styleExplanations.Add($"✓ {rule.Explanation}");
                }
            }

            scores[style.Name] = score;
            explanations[style.Name] = styleExplanations;
        }

        // Нормализация оценок (приведение к процентам)
        double maxScore = scores.Values.Max();
        var normalizedScores = scores.ToDictionary(
            kv => kv.Key,
            kv => maxScore > 0 ? (kv.Value / maxScore) * 100 : 0
        );

        // Выбор лучшего
        var best = normalizedScores
            .OrderByDescending(kv => kv.Value)
            .First();

        // Формирование результата
        var recommendation = new ArchitectureRecommendation
        {
            ArchitectureStyle = best.Key,
            ConfidenceFactors = normalizedScores,
            Warnings = GetWarnings(project, best.Key),
            Recommendations = GetRecommendations(project, best.Key),
            Patterns = GetSuitablePatterns(project, best.Key)
        };

        return recommendation;
    }

    /// <summary>
    /// Получение предупреждений
    /// </summary>
    private List<string> GetWarnings(ProjectCharacteristics project, string selectedStyle)
    {
        var warnings = new List<string>();

        var style = _styles.First(s => s.Name == selectedStyle);
        foreach (var whenNot in style.WhenNotToUse)
        {
            // Проверяем, не попадает ли проект под противопоказания
            if (CheckCondition(project, whenNot))
            {
                warnings.Add($"Внимание: {whenNot}");
            }
        }

        return warnings;
    }

    /// <summary>
    /// Получение рекомендаций по реализации
    /// </summary>
    private List<string> GetRecommendations(ProjectCharacteristics project, string selectedStyle)
    {
        var recommendations = new List<string>();

        switch (selectedStyle)
        {
            case "Монолит":
                recommendations.Add("Используйте MVC или 3-layer architecture");
                recommendations.Add("Разделите на слои: Presentation, Business, Data");
                recommendations.Add("Начните с простого, усложняйте постепенно");
                break;

            case "Модульный монолит":
                recommendations.Add("Выделите четкие bounded context");
                recommendations.Add("Используйте DDD для сложной логики");
                recommendations.Add("Разделите модули на уровне сборок");
                recommendations.Add("Рассмотрите CQRS для сложных запросов");
                break;

            case "Микросервисы":
                recommendations.Add("Начните с API Gateway");
                recommendations.Add("Используйте контейнеризацию (Docker)");
                recommendations.Add("Оркестрация через Kubernetes");
                recommendations.Add("Реализуйте распределенный мониторинг");
                recommendations.Add("Паттерны Saga для распределенных транзакций");
                break;
        }

        return recommendations;
    }

    /// <summary>
    /// Получение подходящих паттернов
    /// </summary>
    private List<string> GetSuitablePatterns(ProjectCharacteristics project, string selectedStyle)
    {
        var style = _styles.First(s => s.Name == selectedStyle);
        return style.SuitablePatterns;
    }

    private bool CheckCondition(ProjectCharacteristics project, string condition)
    {
        // Упрощенная проверка
        if (condition.Contains("небольшая команда") && project.TeamSize <= 5)
            return true;

        if (condition.Contains("независимый деплой") && project.RequiresIndependentDeployment)
            return true;

        // Добавьте другие проверки
        return false;
    }
}
