using ArchX.Server.Database;
using ArchX.Server.Entities;
using ArchX.Server.Features.ArchitectureDecision;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.Statistics;

public class StatisticsService(IDbContextFactory<ArchXContext> dbFactory)
{
    private static readonly TreeType[] PatternTreeTypes =
    [
        TreeType.MonolithPatterns,
        TreeType.ModularMonolithPatterns,
        TreeType.MicroservicesPatterns,
    ];

    public async Task<PublicStatisticsResponse> GetPublicAsync()
    {
        await using var context = await dbFactory.CreateDbContextAsync();
        var totalSessions = await context.Sessions.AsNoTracking().CountAsync();
        var registeredUsers = await context.Users.AsNoTracking().CountAsync();
        return new PublicStatisticsResponse(totalSessions, registeredUsers);
    }

    public async Task<StatisticsResponse> GetForUserAsync(long userId, bool isAdmin)
    {
        await using var context = await dbFactory.CreateDbContextAsync();

        var globalTotalSessions = await context.Sessions.AsNoTracking().CountAsync();
        var myTotalSessions = await context.Sessions.AsNoTracking().CountAsync(s => s.UserId == userId);
        var myCompletedSessions =
            await context.Sessions.AsNoTracking().CountAsync(s => s.UserId == userId && s.CompletedAt != null);
        var myFeedback = await context.FeedbackTickets.AsNoTracking().CountAsync(f => f.UserId == userId);

        var personal = new PersonalStatisticsDto(
            globalTotalSessions,
            myTotalSessions,
            myCompletedSessions,
            myFeedback);

        AdminStatisticsDto? admin = null;
        if (isAdmin)
            admin = await BuildAdminAsync(context);

        return new StatisticsResponse(personal, admin);
    }

    private static async Task<AdminStatisticsDto> BuildAdminAsync(ArchXContext context)
    {
        var completedTotal = await context.Sessions.AsNoTracking().CountAsync(s => s.CompletedAt != null);
        var feedbackTotal = await context.FeedbackTickets.AsNoTracking().CountAsync();

        const int days = 30;
        var from = DateTime.UtcNow.Date.AddDays(-(days - 1));

        var sessionDays = await context.Sessions.AsNoTracking()
            .Where(s => s.StartedAt >= from)
            .GroupBy(s => s.StartedAt.Date)
            .Select(g => new { Day = g.Key, Cnt = g.Count() })
            .ToListAsync();

        var feedbackDays = await context.FeedbackTickets.AsNoTracking()
            .Where(f => f.CreatedAt >= from)
            .GroupBy(f => f.CreatedAt.Date)
            .Select(g => new { Day = g.Key, Cnt = g.Count() })
            .ToListAsync();

        var sessionDayMap = sessionDays.ToDictionary(x => DateOnly.FromDateTime(x.Day), x => x.Cnt);
        var feedbackDayMap = feedbackDays.ToDictionary(x => DateOnly.FromDateTime(x.Day), x => x.Cnt);

        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionsPerDay = new List<DailyCountDto>(days);
        var feedbackPerDay = new List<DailyCountDto>(days);
        for (var i = days - 1; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            sessionsPerDay.Add(new DailyCountDto(d, sessionDayMap.GetValueOrDefault(d)));
            feedbackPerDay.Add(new DailyCountDto(d, feedbackDayMap.GetValueOrDefault(d)));
        }

        var styleSessions = await context.Sessions.AsNoTracking()
            .Where(s => s.CompletedAt != null && s.TreeType == TreeType.ArchitectureStyle)
            .Include(s => s.ResultNode)
            .Include(s => s.User)
            .Where(s => s.ResultNode != null && !string.IsNullOrWhiteSpace(s.ResultNode!.ArchitectureStyle))
            .ToListAsync();

        var stylesOverall = new Dictionary<string, int>(StringComparer.Ordinal);
        var stylesByGrade = new Dictionary<Grade, Dictionary<string, int>>();
        foreach (Grade g in Enum.GetValues<Grade>())
            stylesByGrade[g] = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var s in styleSessions)
        {
            var style = s.ResultNode!.ArchitectureStyle!.Trim();
            stylesOverall[style] = stylesOverall.GetValueOrDefault(style) + 1;
            if (Enum.IsDefined(s.User.Grade))
            {
                var byG = stylesByGrade[s.User.Grade];
                byG[style] = byG.GetValueOrDefault(style) + 1;
            }
        }

        const int topOverall = 8;
        var topArchitectureStylesOverall = TopN(stylesOverall, topOverall);
        var topStylesByGrade = ToBreakdownByGrade(stylesByGrade, perBucket: 5);

        var patternSessions = await context.Sessions.AsNoTracking()
            .Where(s => s.CompletedAt != null && PatternTreeTypes.Contains(s.TreeType))
            .Include(s => s.User)
            .ToListAsync();

        var patternsOverall = new Dictionary<string, int>(StringComparer.Ordinal);
        var patternsByGrade = new Dictionary<Grade, Dictionary<string, int>>();
        foreach (Grade g in Enum.GetValues<Grade>())
            patternsByGrade[g] = new Dictionary<string, int>(StringComparer.Ordinal);

        var patternsByProfession = new Dictionary<UserType, Dictionary<string, int>>();
        foreach (UserType t in Enum.GetValues<UserType>())
            patternsByProfession[t] = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var s in patternSessions)
        {
            if (s.ResultNodeId == null)
                continue;

            var patterns = await DecisionTreeHelper.AggregatePatternsAlongPathAsync(
                context, s.Path, s.ResultNodeId);
            foreach (var p in patterns.Distinct(StringComparer.Ordinal))
            {
                if (string.IsNullOrWhiteSpace(p))
                    continue;
                var pt = p.Trim();
                patternsOverall[pt] = patternsOverall.GetValueOrDefault(pt) + 1;
                if (Enum.IsDefined(s.User.Grade))
                {
                    var gDict = patternsByGrade[s.User.Grade];
                    gDict[pt] = gDict.GetValueOrDefault(pt) + 1;
                }

                if (Enum.IsDefined(s.User.UserType))
                {
                    var tDict = patternsByProfession[s.User.UserType];
                    tDict[pt] = tDict.GetValueOrDefault(pt) + 1;
                }
            }
        }

        var topPatternsOverall = TopN(patternsOverall, topOverall);
        var topPatternsByGrade = ToBreakdownByGrade(patternsByGrade, perBucket: 5);
        var topPatternsByProfession = ToBreakdownByProfession(patternsByProfession, perBucket: 5);

        var distinctUsers = await context.Sessions.AsNoTracking()
            .Select(s => s.UserId)
            .Distinct()
            .CountAsync();

        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var activeUsersWeek = await context.Sessions.AsNoTracking()
            .Where(s => s.StartedAt >= weekAgo)
            .Select(s => s.UserId)
            .Distinct()
            .CountAsync();

        return new AdminStatisticsDto(
            completedTotal,
            feedbackTotal,
            sessionsPerDay,
            feedbackPerDay,
            topArchitectureStylesOverall,
            topPatternsOverall,
            topStylesByGrade,
            topPatternsByGrade,
            topPatternsByProfession,
            distinctUsers,
            activeUsersWeek);
    }

    private static List<NamedCountDto> TopN(Dictionary<string, int> counts, int n) =>
        counts
            .OrderByDescending(kv => kv.Value)
            .Take(n)
            .Select(kv => new NamedCountDto(kv.Key, kv.Value))
            .ToList();

    private static List<BreakdownByGradeDto> ToBreakdownByGrade(
        Dictionary<Grade, Dictionary<string, int>> byGrade,
        int perBucket) =>
        Enum.GetValues<Grade>()
            .Cast<Grade>()
            .Select(g => new BreakdownByGradeDto((int)g, TopN(byGrade[g], perBucket)))
            .ToList();

    private static List<BreakdownByProfessionDto> ToBreakdownByProfession(
        Dictionary<UserType, Dictionary<string, int>> byProfession,
        int perBucket) =>
        Enum.GetValues<UserType>()
            .Cast<UserType>()
            .Select(t => new BreakdownByProfessionDto((int)t, TopN(byProfession[t], perBucket)))
            .ToList();
}
