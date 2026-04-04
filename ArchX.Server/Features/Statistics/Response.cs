namespace ArchX.Server.Features.Statistics;

public record PublicStatisticsResponse(int TotalSessions, int RegisteredUsers);

public record PersonalStatisticsDto(
    int GlobalTotalSessions,
    int MyTotalSessions,
    int MyCompletedSessions,
    int MyFeedbackTickets);

public record NamedCountDto(string Name, int Count);

public record DailyCountDto(DateOnly Date, int Count);

public record BreakdownByGradeDto(int Grade, IReadOnlyList<NamedCountDto> TopItems);

public record BreakdownByProfessionDto(int Profession, IReadOnlyList<NamedCountDto> TopItems);

public record AdminStatisticsDto(
    int CompletedSessionsTotal,
    int FeedbackTicketsTotal,
    IReadOnlyList<DailyCountDto> SessionsPerDay,
    IReadOnlyList<DailyCountDto> FeedbackTicketsPerDay,
    IReadOnlyList<NamedCountDto> TopArchitectureStylesOverall,
    IReadOnlyList<NamedCountDto> TopPatternsOverall,
    IReadOnlyList<BreakdownByGradeDto> TopArchitectureStylesByGrade,
    IReadOnlyList<BreakdownByGradeDto> TopPatternsByGrade,
    IReadOnlyList<BreakdownByProfessionDto> TopPatternsByProfession,
    int DistinctUsersWithSessions,
    int ActiveUsersLast7Days);

public record StatisticsResponse(PersonalStatisticsDto Personal, AdminStatisticsDto? Admin);
