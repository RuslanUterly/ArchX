using ArchX.Server.Features.ArchitectureAdvisor.Engine;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.ArchitectureAdvisor;

[ApiController]
[Route("api/[controller]")]
public class AdvisorController(ArchitectureAdvisorEngine advisor) : ControllerBase
{
    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeProject([FromBody] ProjectDto projectDto)
    {
        // Сохраняем исходные данные
        var project = new ProjectCharacteristics
        {
            TeamSize = projectDto.TeamSize,
            RequiresACID = projectDto.RequiresACID,
            ProjectType = projectDto.ProjectType,
            ExpectedUsers = projectDto.ExpectedUsers,
            DeploymentModel = projectDto.DeploymentModel,
            DifferentScalingNeeds = projectDto.DifferentScalingNeeds,
            DevelopmentTime = projectDto.DevelopmentTime,
            TeamExperience = projectDto.TeamExperience,
            RequiresIndependentDeployment = projectDto.RequiresIndependentDeployment,
            RequiresPolyglotPersistence = projectDto.RequiresPolyglotPersistence
        };

        // Получаем рекомендацию
        var recommendation = advisor.GetRecommendation(project);

        //// Сохраняем в БД для статистики
        //var session = new DecisionSession
        //{
        //    SessionDate = DateTime.UtcNow,
        //    ProjectName = projectDto.ProjectName,
        //    UserId = User.Identity.Name,
        //    ProjectCharacteristics = JsonSerializer.Serialize(project),
        //    SelectedArchitecture = recommendation.ArchitectureStyle,
        //    ConfidenceFactors = JsonSerializer.Serialize(recommendation.ConfidenceFactors),
        //    DecisionPath = JsonSerializer.Serialize(projectDto.Answers ?? new { })
        //};

        //_context.DecisionSessions.Add(session);
        //await _context.SaveChangesAsync();

        return Ok(new
        {
            Recommendation = recommendation,
            //SessionId = session.Id
        });
    }

    [HttpGet("styles")]
    public IActionResult GetArchitectureStyles()
    {
        var styles = new[]
        {
            new {
                Name = "Монолит",
                Description = "Единое приложение, простота разработки и развертывания",
                SuitableFor = "Стартапы, MVP, небольшие команды",
                Complexity = "Низкая"
            },
            new {
                Name = "Модульный монолит",
                Description = "Монолит с четкими границами модулей",
                SuitableFor = "Средние проекты, сложный домен",
                Complexity = "Средняя"
            },
            new {
                Name = "Микросервисы",
                Description = "Набор независимых сервисов",
                SuitableFor = "Крупные проекты, высокая нагрузка",
                Complexity = "Высокая"
            }
        };

        return Ok(styles);
    }

    [HttpGet("statistics")]
    public IActionResult GetStatistics()
    {
        //var stats = _context.DecisionSessions
        //    .GroupBy(s => s.SelectedArchitecture)
        //    .Select(g => new
        //    {
        //        Architecture = g.Key,
        //        Count = g.Count(),
        //        AverageTeamSize = g.Average(s =>
        //            JsonSerializer.Deserialize<ProjectCharacteristics>(s.ProjectCharacteristics).TeamSize)
        //    })
        //    .ToList();

        //return Ok(stats);
        return Ok();
    }
}

public class ProjectDto
{
    public string ProjectName { get; set; }
    public int TeamSize { get; set; }
    public bool RequiresACID { get; set; }
    public string ProjectType { get; set; }
    public int ExpectedUsers { get; set; }
    public string DeploymentModel { get; set; }
    public bool DifferentScalingNeeds { get; set; }
    public int DevelopmentTime { get; set; }
    public string TeamExperience { get; set; }
    public bool RequiresIndependentDeployment { get; set; }
    public bool RequiresPolyglotPersistence { get; set; }
    public Dictionary<string, string> Answers { get; set; }
}
