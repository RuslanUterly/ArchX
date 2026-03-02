using ArchX.Server.Database;
using ArchX.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.ArchitectureDecision;

public static class ArchitectureStyleTreeSeed
{
    public static (List<Node>, List<Link>) GetNodesAndLinks()
    {
        var nodes = new List<Node>();
        var links = new List<Link>();

        // Корневой вопрос
        var startNode = new Node
        {
            Id = 1001,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Необходимо независимое развертывание компонентов?"
        };
        nodes.Add(startNode);

        // Уровень 1 - Ветка "НЕТ" (независимость не нужна)
        var qScale = new Node
        {
            Id = 1002,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Высокая нагрузка / горизонтальное масштабирование?"
        };
        nodes.Add(qScale);
        links.Add(new Link { ParentId = startNode.Id, ChildId = qScale.Id, Condition = "Нет" });

        // Уровень 1 - Ветка "ДА" (независимость нужна)
        var q2 = new Node
        {
            Id = 1003,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Строгая ACID-транзакционность критична?"
        };
        nodes.Add(q2);
        links.Add(new Link { ParentId = startNode.Id, ChildId = q2.Id, Condition = "Да" });

        // ===== ВЕТКА "НЕТ" (независимость не нужна) =====

        // Вопросы для ветки "НЕТ" - низкая нагрузка
        var qDomainLow = new Node
        {
            Id = 1004,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Сложность предметной области?"
        };
        nodes.Add(qDomainLow);
        links.Add(new Link { ParentId = qScale.Id, ChildId = qDomainLow.Id, Condition = "Нет" });

        // Вопросы размера команды для низкой сложности
        var qTeamLowSmall = new Node
        {
            Id = 1005,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamLowSmall);
        links.Add(new Link { ParentId = qDomainLow.Id, ChildId = qTeamLowSmall.Id, Condition = "Низкая" });

        // Результаты для низкой сложности
        var monoSimple = new Node
        {
            Id = 1006,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Простой монолит для небольших команд"
        };
        nodes.Add(monoSimple);
        links.Add(new Link { ParentId = qTeamLowSmall.Id, ChildId = monoSimple.Id, Condition = "≤ 5" });

        var monoClean = new Node
        {
            Id = 1007,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с чистой архитектурой для больших команд"
        };
        nodes.Add(monoClean);
        links.Add(new Link { ParentId = qTeamLowSmall.Id, ChildId = monoClean.Id, Condition = "> 5" });

        // Вопросы для высокой сложности домена
        var qTeamLowHigh = new Node
        {
            Id = 1008,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamLowHigh);
        links.Add(new Link { ParentId = qDomainLow.Id, ChildId = qTeamLowHigh.Id, Condition = "Высокая" });

        var monoDDD = new Node
        {
            Id = 1009,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с DDD для сложного домена"
        };
        nodes.Add(monoDDD);
        links.Add(new Link { ParentId = qTeamLowHigh.Id, ChildId = monoDDD.Id, Condition = "≤ 5" });

        var modMono = new Node
        {
            Id = 1010,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Модульный монолит",
            Description = "Модульный монолит для больших команд"
        };
        nodes.Add(modMono);
        links.Add(new Link { ParentId = qTeamLowHigh.Id, ChildId = modMono.Id, Condition = "> 5" });

        // Высокая нагрузка
        var qACID = new Node
        {
            Id = 1011,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Строгая ACID-транзакционность?"
        };
        nodes.Add(qACID);
        links.Add(new Link { ParentId = qScale.Id, ChildId = qACID.Id, Condition = "Да" });

        // ACID = Да
        var qDomainACID = new Node
        {
            Id = 1012,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Сложность домена?"
        };
        nodes.Add(qDomainACID);
        links.Add(new Link { ParentId = qACID.Id, ChildId = qDomainACID.Id, Condition = "Да" });

        // Низкая сложность домена с ACID
        var qTimeACID = new Node
        {
            Id = 1013,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Скорость вывода на рынок?"
        };
        nodes.Add(qTimeACID);
        links.Add(new Link { ParentId = qDomainACID.Id, ChildId = qTimeACID.Id, Condition = "Низкая" });

        var acidFastMono = new Node
        {
            Id = 1014,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с кластеризацией"
        };
        nodes.Add(acidFastMono);
        links.Add(new Link { ParentId = qTimeACID.Id, ChildId = acidFastMono.Id, Condition = "Быстро" });

        var acidSlowServices = new Node
        {
            Id = 1015,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Микросервисы",
            Description = "Микросервисы с сагами"
        };
        nodes.Add(acidSlowServices);
        links.Add(new Link { ParentId = qTimeACID.Id, ChildId = acidSlowServices.Id, Condition = "Не критично" });

        // Высокая сложность домена с ACID
        var qTeamACID = new Node
        {
            Id = 1016,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamACID);
        links.Add(new Link { ParentId = qDomainACID.Id, ChildId = qTeamACID.Id, Condition = "Высокая" });

        var acidComplexSmall = new Node
        {
            Id = 1017,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Модульный монолит",
            Description = "Модульный монолит с DDD"
        };
        nodes.Add(acidComplexSmall);
        links.Add(new Link { ParentId = qTeamACID.Id, ChildId = acidComplexSmall.Id, Condition = "≤ 5" });

        var acidComplexLarge = new Node
        {
            Id = 1018,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Микросервисы",
            Description = "Микросервисы с DDD и сагами"
        };
        nodes.Add(acidComplexLarge);
        links.Add(new Link { ParentId = qTeamACID.Id, ChildId = acidComplexLarge.Id, Condition = "> 5" });

        // ACID = Нет
        var qDomainNoIndep = new Node
        {
            Id = 1019,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Сложность домена?"
        };
        nodes.Add(qDomainNoIndep);
        links.Add(new Link { ParentId = qACID.Id, ChildId = qDomainNoIndep.Id, Condition = "Нет" });

        // Низкая сложность, без ACID
        var qTeamNoIndepSmall = new Node
        {
            Id = 1020,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamNoIndepSmall);
        links.Add(new Link { ParentId = qDomainNoIndep.Id, ChildId = qTeamNoIndepSmall.Id, Condition = "Низкая" });

        var noIndepSimpleSmall = new Node
        {
            Id = 1021,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Модульный монолит",
            Description = "Модульный монолит"
        };
        nodes.Add(noIndepSimpleSmall);
        links.Add(new Link { ParentId = qTeamNoIndepSmall.Id, ChildId = noIndepSimpleSmall.Id, Condition = "≤ 5" });

        var noIndepSimpleLarge = new Node
        {
            Id = 1022,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с чёткими модулями"
        };
        nodes.Add(noIndepSimpleLarge);
        links.Add(new Link { ParentId = qTeamNoIndepSmall.Id, ChildId = noIndepSimpleLarge.Id, Condition = "> 5" });

        // Высокая сложность, без ACID
        var qTeamNoIndepHigh = new Node
        {
            Id = 1023,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamNoIndepHigh);
        links.Add(new Link { ParentId = qDomainNoIndep.Id, ChildId = qTeamNoIndepHigh.Id, Condition = "Высокая" });

        var noIndepHighSmall = new Node
        {
            Id = 1024,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Модульный монолит",
            Description = "Модульный монолит с DDD"
        };
        nodes.Add(noIndepHighSmall);
        links.Add(new Link { ParentId = qTeamNoIndepHigh.Id, ChildId = noIndepHighSmall.Id, Condition = "≤ 5" });

        var noIndepHighLarge = new Node
        {
            Id = 1025,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Микросервисы",
            Description = "Микросервисы с ограниченными контекстами"
        };
        nodes.Add(noIndepHighLarge);
        links.Add(new Link { ParentId = qTeamNoIndepHigh.Id, ChildId = noIndepHighLarge.Id, Condition = "> 5" });

        // ===== ВЕТКА "ДА" (независимость нужна) =====

        // ACID да
        var qDomainHigh = new Node
        {
            Id = 1026,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Сложность предметной области?"
        };
        nodes.Add(qDomainHigh);
        links.Add(new Link { ParentId = q2.Id, ChildId = qDomainHigh.Id, Condition = "Да" });

        // Низкая сложность
        var qTeamACIDIndep = new Node
        {
            Id = 1027,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamACIDIndep);
        links.Add(new Link { ParentId = qDomainHigh.Id, ChildId = qTeamACIDIndep.Id, Condition = "Низкая" });

        var a2 = new Node
        {
            Id = 1028,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с ACID"
        };
        nodes.Add(a2);
        links.Add(new Link { ParentId = qTeamACIDIndep.Id, ChildId = a2.Id, Condition = "≤ 5" });

        var a1 = new Node
        {
            Id = 1029,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Модульный монолит",
            Description = "Модульный монолит с распределёнными транзакциями"
        };
        nodes.Add(a1);
        links.Add(new Link { ParentId = qTeamACIDIndep.Id, ChildId = a1.Id, Condition = "> 5" });

        // Высокая сложность
        var qTeamACIDHigh = new Node
        {
            Id = 1030,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Размер команды?"
        };
        nodes.Add(qTeamACIDHigh);
        links.Add(new Link { ParentId = qDomainHigh.Id, ChildId = qTeamACIDHigh.Id, Condition = "Высокая" });

        var a7 = new Node
        {
            Id = 1031,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с DDD и ACID"
        };
        nodes.Add(a7);
        links.Add(new Link { ParentId = qTeamACIDHigh.Id, ChildId = a7.Id, Condition = "≤ 5" });

        var a5Var = new Node
        {
            Id = 1032,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Микросервисы",
            Description = "Микросервисы с DDD и сагами"
        };
        nodes.Add(a5Var);
        links.Add(new Link { ParentId = qTeamACIDHigh.Id, ChildId = a5Var.Id, Condition = "> 5" });

        // ACID нет
        var q5 = new Node
        {
            Id = 1033,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Требуется масштабирование по нагрузке отдельных компонентов?"
        };
        nodes.Add(q5);
        links.Add(new Link { ParentId = q2.Id, ChildId = q5.Id, Condition = "Нет" });

        // Масштабирование нужно
        var q6 = new Node
        {
            Id = 1034,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Бюджет и время ограничены?"
        };
        nodes.Add(q6);
        links.Add(new Link { ParentId = q5.Id, ChildId = q6.Id, Condition = "Да" });

        var a4 = new Node
        {
            Id = 1035,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Модульный монолит",
            Description = "Монолит с выделением модулей для будущего перехода"
        };
        nodes.Add(a4);
        links.Add(new Link { ParentId = q6.Id, ChildId = a4.Id, Condition = "Да" });

        var a5 = new Node
        {
            Id = 1036,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Микросервисы",
            Description = "Микросервисы"
        };
        nodes.Add(a5);
        links.Add(new Link { ParentId = q6.Id, ChildId = a5.Id, Condition = "Нет" });

        // Масштабирование не нужно
        var qDomainScale = new Node
        {
            Id = 1037,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Question",
            QuestionText = "Сложность предметной области?"
        };
        nodes.Add(qDomainScale);
        links.Add(new Link { ParentId = q5.Id, ChildId = qDomainScale.Id, Condition = "Нет" });

        var a3 = new Node
        {
            Id = 1038,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с горизонтальным масштабированием"
        };
        nodes.Add(a3);
        links.Add(new Link { ParentId = qDomainScale.Id, ChildId = a3.Id, Condition = "Низкая" });

        var a9 = new Node
        {
            Id = 1039,
            TreeType = TreeType.ArchitectureStyle,
            Type = "Result",
            ArchitectureStyle = "Монолит",
            Description = "Монолит с DDD и горизонтальным масштабированием"
        };
        nodes.Add(a9);
        links.Add(new Link { ParentId = qDomainScale.Id, ChildId = a9.Id, Condition = "Высокая" });

        return (nodes, links);
    }
}

public static class MonolithPatternsTreeSeed
{
    public static (List<Node>, List<Link>) GetNodesAndLinks()
    {
        var nodes = new List<Node>();
        var links = new List<Link>();

        // Вопрос о сложности бизнес-логики
        var qm1 = new Node
        {
            Id = 2002,
            TreeType = TreeType.MonolithPatterns,
            Type = "Question",
            QuestionText = "Сложность бизнес-логики (Domain Complexity)?"
        };
        nodes.Add(qm1);
        //links.Add(new Link { ParentId = styleNode.Id, ChildId = qm1.Id, Condition = "Старт" });

        // Ветка низкой сложности (CRUD)
        var qm2 = new Node
        {
            Id = 2003,
            TreeType = TreeType.MonolithPatterns,
            Type = "Question",
            QuestionText = "Требования к скорости разработки и старта?"
        };
        nodes.Add(qm2);
        links.Add(new Link { ParentId = qm1.Id, ChildId = qm2.Id, Condition = "Низкая CRUD" });

        // Результаты для низкой сложности
        var monoSimpleLayer = new Node
        {
            Id = 2004,
            TreeType = TreeType.MonolithPatterns,
            Type = "Result",
            Patterns = ["Layered (cлоистая архитектура)", "N-tier (многоуровневая архитектура)"],
            Description = "Быстрый старт, простые CRUD операции",
            Pros = ["Простота", "Быстрота разработки","Понятность"],
            Cons = ["Сложность поддержки при росте домена"]
        };
        nodes.Add(monoSimpleLayer);
        links.Add(new Link { ParentId = qm2.Id, ChildId = monoSimpleLayer.Id, Condition = "Высокие" });

        var monoSimpleVertical = new Node
        {
            Id = 2005,
            TreeType = TreeType.MonolithPatterns,
            Type = "Result",
            Patterns = ["Vertical Slice Architecture"],
            Description = "Лучшая поддержка, если домен вырастет",
            Pros = ["Изоляция функциональности", "Легкий рефакторинг"],
            Cons = ["Может быть избыточной для простых CRUD"]
        };
        nodes.Add(monoSimpleVertical);
        links.Add(new Link { ParentId = qm2.Id, ChildId = monoSimpleVertical.Id, Condition = "Средние/Низкие" });

        // Ветка высокой сложности
        var qm3 = new Node
        {
            Id = 2006,
            TreeType = TreeType.MonolithPatterns,
            Type = "Question",
            QuestionText = "Сложность командной структуры?"
        };
        nodes.Add(qm3);
        links.Add(new Link { ParentId = qm1.Id, ChildId = qm3.Id, Condition = "Высокая" });

        var monoHighClean = new Node
        {
            Id = 2007,
            TreeType = TreeType.MonolithPatterns,
            Type = "Result",
            Patterns = ["Clean Architecture", "Onion Architecture"],
            Description = "Инверсия зависимостей, тестируемость",
            Pros = ["Четкое разделение ответственности", "Тестируемость"],
            Cons = ["Сложность, больше boilerplate кода"]
        };
        nodes.Add(monoHighClean);
        links.Add(new Link { ParentId = qm3.Id, ChildId = monoHighClean.Id, Condition = "Одна команда" });

        var monoHighDDD = new Node
        {
            Id = 2008,
            TreeType = TreeType.MonolithPatterns,
            Type = "Result",
            Patterns = ["DDD", "Bounded Contexts"],
            Description = "Модули по контекстам",
            Pros = ["Четкие границы", "Соответствие бизнесу"],
            Cons = ["Требует глубокого понимания домена"]
        };
        nodes.Add(monoHighDDD);
        links.Add(new Link { ParentId = qm3.Id, ChildId = monoHighDDD.Id, Condition = "Несколько команд в одном коде" });

        return (nodes, links);
    }
}

public static class ModularMonolithPatternsTreeSeed
{
    public static (List<Node>, List<Link>) GetNodesAndLinks()
    {
        var nodes = new List<Node>();
        var links = new List<Link>();

        // Вопрос о границах модулей
        var qmm1 = new Node
        {
            Id = 3002,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Question",
            QuestionText = "Границы модулей определены?"
        };
        nodes.Add(qmm1);
        //links.Add(new Link { ParentId = styleNode.Id, ChildId = qmm1.Id, Condition = "Старт" });

        // Ветка "Границы определены"
        var qmm2 = new Node
        {
            Id = 3003,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Question",
            QuestionText = "Связь между модулями?"
        };
        nodes.Add(qmm2);
        links.Add(new Link { ParentId = qmm1.Id, ChildId = qmm2.Id, Condition = "Да" });

        var modStrong = new Node
        {
            Id = 3004,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Result",
            Patterns = ["Modular Monolith"],
            Description = "Строгие интерфейсы, DI",
            Pros = ["Четкие контракты", "Легко тестировать"],
            Cons = ["Сложность проектирования интерфейсов"]
        };
        nodes.Add(modStrong);
        links.Add(new Link { ParentId = qmm2.Id, ChildId = modStrong.Id, Condition = "Синхронная in-memory" });

        var modEvents = new Node
        {
            Id = 3005,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Result",
            Patterns = ["Event-Driven"],
            Description = "Шина событий в процессе",
            Pros = ["Слабая связанность","Асинхронность"],
            Cons = ["Сложность отладки", "Eventual consistency"]
        };
        nodes.Add(modEvents);
        links.Add(new Link { ParentId = qmm2.Id, ChildId = modEvents.Id, Condition = "Асинхронная события" });

        // Ветка "Границы не определены"
        var qmm3 = new Node
        {
            Id = 3006,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Question",
            QuestionText = "Основной драйвер для модульности?"
        };
        nodes.Add(qmm3);
        links.Add(new Link { ParentId = qmm1.Id, ChildId = qmm3.Id, Condition = "Нет, нужно выделить" });

        var modTeam = new Node
        {
            Id = 3007,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Result",
            Patterns = ["Modular by Team"],
            Description = "Модули = команды",
            Pros = ["Соответствует организационной структуре"],
            Cons = ["Может не совпадать с бизнес-доменами"]
        };
        nodes.Add(modTeam);
        links.Add(new Link { ParentId = qmm3.Id, ChildId = modTeam.Id, Condition = "Организационная структура" });

        var modDomain = new Node
        {
            Id = 3008,
            TreeType = TreeType.ModularMonolithPatterns,
            Type = "Result",
            Patterns = ["DDD Modular"],
            Description = "Модули = bounded contexts",
            Pros = ["Соответствует предметной области"],
            Cons = ["Требует глубокого анализа домена"]
        };
        nodes.Add(modDomain);
        links.Add(new Link { ParentId = qmm3.Id, ChildId = modDomain.Id, Condition = "Бизнес-домены" });

        return (nodes, links);
    }
}

public static class MicroservicesPatternsTreeSeed
{
    public static (List<Node>, List<Link>) GetNodesAndLinks()
    {
        var nodes = new List<Node>();
        var links = new List<Link>();

        // Вопрос о стратегии данных
        var qmsData = new Node
        {
            Id = 4002,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Стратегия данных: Как делить данные?"
        };
        nodes.Add(qmsData);
        //links.Add(new Link { ParentId = styleNode.Id, ChildId = qmsData.Id, Condition = "Старт" });

        // Предупреждение для ACID
        var msWarning = new Node
        {
            Id = 4003,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "⚠️ Предупреждение: ACID транзакции в микросервисах - риск"
        };
        nodes.Add(msWarning);
        links.Add(new Link { ParentId = qmsData.Id, ChildId = msWarning.Id, Condition = "ACID транзакции критичны (редко)" });

        var msDataACID = new Node
        {
            Id = 4004,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "Shared Database (анти-паттерн для МС)" },
            Description = "Общая база данных для нескольких сервисов",
            Pros = new List<string> { "ACID транзакции, простота" },
            Cons = new List<string> { "Связанность, сложность масштабирования" }
        };
        nodes.Add(msDataACID);
        links.Add(new Link { ParentId = msWarning.Id, ChildId = msDataACID.Id, Condition = "Продолжить" });

        // Основная ветка - согласованность в конечном счёте
        var qmsInteraction = new Node
        {
            Id = 4005,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Характер взаимодействия?"
        };
        nodes.Add(qmsInteraction);
        links.Add(new Link { ParentId = qmsData.Id, ChildId = qmsInteraction.Id, Condition = "Согласованность в конечном счёте" });

        // Синхронное взаимодействие
        var qmsSync = new Node
        {
            Id = 4006,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Инфраструктура обнаружения?"
        };
        nodes.Add(qmsSync);
        links.Add(new Link { ParentId = qmsInteraction.Id, ChildId = qmsSync.Id, Condition = "Синхронное" });

        var msSyncSimple = new Node
        {
            Id = 4007,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Базовый синхронный подход"
        };
        nodes.Add(msSyncSimple);
        links.Add(new Link { ParentId = qmsSync.Id, ChildId = msSyncSimple.Id, Condition = "Статическое" });

        var msSyncDiscovery = new Node
        {
            Id = 4008,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Динамическое обнаружение"
        };
        nodes.Add(msSyncDiscovery);
        links.Add(new Link { ParentId = qmsSync.Id, ChildId = msSyncDiscovery.Id, Condition = "Динамическое" });

        // Асинхронное взаимодействие
        var qmsAsync = new Node
        {
            Id = 4009,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Сложность бизнес-процессов?"
        };
        nodes.Add(qmsAsync);
        links.Add(new Link { ParentId = qmsInteraction.Id, ChildId = qmsAsync.Id, Condition = "Асинхронное" });

        var msAsyncSimple = new Node
        {
            Id = 4010,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Простые цепочки"
        };
        nodes.Add(msAsyncSimple);
        links.Add(new Link { ParentId = qmsAsync.Id, ChildId = msAsyncSimple.Id, Condition = "Простые цепочки" });

        var msAsyncSaga = new Node
        {
            Id = 4011,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Сложные процессы"
        };
        nodes.Add(msAsyncSaga);
        links.Add(new Link { ParentId = qmsAsync.Id, ChildId = msAsyncSaga.Id, Condition = "Сложные процессы" });

        // Смешанное взаимодействие
        var msHybridPre = new Node
        {
            Id = 4012,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Подготовка CQRS"
        };
        nodes.Add(msHybridPre);
        links.Add(new Link { ParentId = qmsInteraction.Id, ChildId = msHybridPre.Id, Condition = "Смешанное" });

        var msHybrid = new Node
        {
            Id = 4013,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "CQRS + Event Sourcing"
        };
        nodes.Add(msHybrid);
        links.Add(new Link { ParentId = msHybridPre.Id, ChildId = msHybrid.Id, Condition = "Продолжить" });

        // СОЗДАЕМ ОТДЕЛЬНЫЕ УЗЛЫ ДЛЯ КАЖДОГО ПУТИ К OBSERVABILITY
        var qmsObserve1 = new Node
        {
            Id = 4014,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Observability?"
        };
        nodes.Add(qmsObserve1);
        links.Add(new Link { ParentId = msSyncSimple.Id, ChildId = qmsObserve1.Id, Condition = "Настроить Observability" });

        var qmsObserve2 = new Node
        {
            Id = 4015,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Observability?"
        };
        nodes.Add(qmsObserve2);
        links.Add(new Link { ParentId = msSyncDiscovery.Id, ChildId = qmsObserve2.Id, Condition = "Настроить Observability" });

        var qmsObserve3 = new Node
        {
            Id = 4016,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Observability?"
        };
        nodes.Add(qmsObserve3);
        links.Add(new Link { ParentId = msAsyncSimple.Id, ChildId = qmsObserve3.Id, Condition = "Настроить Observability" });

        var qmsObserve4 = new Node
        {
            Id = 4017,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Observability?"
        };
        nodes.Add(qmsObserve4);
        links.Add(new Link { ParentId = msAsyncSaga.Id, ChildId = qmsObserve4.Id, Condition = "Настроить Observability" });

        var qmsObserve5 = new Node
        {
            Id = 4018,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Observability?"
        };
        nodes.Add(qmsObserve5);
        links.Add(new Link { ParentId = msHybrid.Id, ChildId = qmsObserve5.Id, Condition = "Настроить Observability" });

        var qmsObserve6 = new Node
        {
            Id = 4019,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Question",
            QuestionText = "Observability?"
        };
        nodes.Add(qmsObserve6);
        links.Add(new Link { ParentId = msDataACID.Id, ChildId = qmsObserve6.Id, Condition = "Настроить Observability" });

        // Результаты Observability
        var msObserve = new Node
        {
            Id = 4020,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "Distributed Tracing", "Centralized Logging" },
            Description = "Полная наблюдаемость",
            Pros = new List<string> { "Полный контроль", "Быстрая диагностика" },
            Cons = new List<string> { "Сложность настройки", "Затраты ресурсов" }
        };
        nodes.Add(msObserve);

        var msObserveSimple = new Node
        {
            Id = 4021,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "Health Checks", "Metrics" },
            Description = "Базовая наблюдаемость",
            Pros = new List<string> { "Простота", "Минимальные затраты" },
            Cons = new List<string> { "Ограниченная диагностика" }
        };
        nodes.Add(msObserveSimple);

        // Связи от каждого Observability узла к результатам
        for (int i = 4014; i <= 4019; i++)
        {
            links.Add(new Link { ParentId = i, ChildId = msObserve.Id, Condition = "Да" });
            links.Add(new Link { ParentId = i, ChildId = msObserveSimple.Id, Condition = "Нет/базово" });
        }

        // Финальные узлы (каждый с уникальным ID)
        var msSyncSimpleFinal = new Node
        {
            Id = 4022,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "REST/gRPC", "Client LB", "Circuit Breaker", "Retry" },
            Description = "Синхронное взаимодействие со статическим обнаружением",
            Pros = new List<string> { "Простота", "Предсказуемость" },
            Cons = new List<string> { "Меньшая гибкость при масштабировании" }
        };
        nodes.Add(msSyncSimpleFinal);

        var msSyncDiscoveryFinal = new Node
        {
            Id = 4023,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "API Gateway", "Service Discovery", "Client-side LB", "Circuit Breaker" },
            Description = "Синхронное взаимодействие с динамическим обнаружением",
            Pros = new List<string> { "Гибкость", "Отказоустойчивость" },
            Cons = new List<string> { "Сложность инфраструктуры" }
        };
        nodes.Add(msSyncDiscoveryFinal);

        var msAsyncSimpleFinal = new Node
        {
            Id = 4024,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "Message Broker", "Competing Consumers", "Dead Letter" },
            Description = "Асинхронное взаимодействие с очередями",
            Pros = new List<string> { "Слабая связанность", "Масштабирование" },
            Cons = new List<string> { "Сложность отладки" }
        };
        nodes.Add(msAsyncSimpleFinal);

        var msAsyncSagaFinal = new Node
        {
            Id = 4025,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "Saga", "Message Broker", "Compensating Transactions" },
            Description = "Сложные бизнес-процессы с компенсацией",
            Pros = new List<string> { "Поддержка распределенных транзакций" },
            Cons = new List<string> { "Сложность реализации" }
        };
        nodes.Add(msAsyncSagaFinal);

        var msHybridFinal = new Node
        {
            Id = 4026,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "CQRS", "Event Sourcing", "Separate Read/Write Models", "Projections" },
            Description = "Смешанный подход с разделением моделей",
            Pros = new List<string> { "Максимальная гибкость", "Аудит" },
            Cons = new List<string> { "Высокая сложность" }
        };
        nodes.Add(msHybridFinal);

        var msDataACIDFinal = new Node
        {
            Id = 4027,
            TreeType = TreeType.MicroservicesPatterns,
            Type = "Result",
            Patterns = new List<string> { "Shared Database", "2PC/DTC риск" },
            Description = "Общая БД с распределенными транзакциями",
            Pros = new List<string> { "Кислотность" },
            Cons = new List<string> { "Риск", "Связанность" }
        };
        nodes.Add(msDataACIDFinal);

        // Связи от результатов Observability к финальным узлам
        // Для каждого пути - своя связь с уникальным условием
        links.Add(new Link { ParentId = msObserve.Id, ChildId = msSyncSimpleFinal.Id, Condition = "Завершить SyncSimple" });
        links.Add(new Link { ParentId = msObserveSimple.Id, ChildId = msSyncSimpleFinal.Id, Condition = "Завершить SyncSimple" });

        links.Add(new Link { ParentId = msObserve.Id, ChildId = msSyncDiscoveryFinal.Id, Condition = "Завершить SyncDiscovery" });
        links.Add(new Link { ParentId = msObserveSimple.Id, ChildId = msSyncDiscoveryFinal.Id, Condition = "Завершить SyncDiscovery" });

        links.Add(new Link { ParentId = msObserve.Id, ChildId = msAsyncSimpleFinal.Id, Condition = "Завершить AsyncSimple" });
        links.Add(new Link { ParentId = msObserveSimple.Id, ChildId = msAsyncSimpleFinal.Id, Condition = "Завершить AsyncSimple" });

        links.Add(new Link { ParentId = msObserve.Id, ChildId = msAsyncSagaFinal.Id, Condition = "Завершить AsyncSaga" });
        links.Add(new Link { ParentId = msObserveSimple.Id, ChildId = msAsyncSagaFinal.Id, Condition = "Завершить AsyncSaga" });

        links.Add(new Link { ParentId = msObserve.Id, ChildId = msHybridFinal.Id, Condition = "Завершить Hybrid" });
        links.Add(new Link { ParentId = msObserveSimple.Id, ChildId = msHybridFinal.Id, Condition = "Завершить Hybrid" });

        links.Add(new Link { ParentId = msObserve.Id, ChildId = msDataACIDFinal.Id, Condition = "Завершить DataACID" });
        links.Add(new Link { ParentId = msObserveSimple.Id, ChildId = msDataACIDFinal.Id, Condition = "Завершить DataACID" });

        return (nodes, links);
    }
}


public class SeedData
{
    public static void Initialize(IServiceProvider serviceProvider)
    {
        using var context = new ArchXContext(
            serviceProvider.GetRequiredService<DbContextOptions<ArchXContext>>());

        // Очищаем существующие данные (если нужно)
        context.Sessions.RemoveRange(context.Sessions);
        context.Links.RemoveRange(context.Links);
        context.Nodes.RemoveRange(context.Nodes);
        context.SaveChanges();

        // Добавляем все деревья
        var seed1 = ArchitectureStyleTreeSeed.GetNodesAndLinks();
        var seed2 = MonolithPatternsTreeSeed.GetNodesAndLinks();
        var seed3 = ModularMonolithPatternsTreeSeed.GetNodesAndLinks();
        var seed4 = MicroservicesPatternsTreeSeed.GetNodesAndLinks();

        context.Nodes.AddRange(seed1.Item1);
        context.Nodes.AddRange(seed2.Item1);
        context.Nodes.AddRange(seed3.Item1);
        context.Nodes.AddRange(seed4.Item1);

        context.SaveChanges();

        context.Links.AddRange(seed1.Item2);
        context.SaveChanges();
        context.Links.AddRange(seed2.Item2);
        context.SaveChanges();
        context.Links.AddRange(seed3.Item2);
        context.SaveChanges();
        context.Links.AddRange(seed4.Item2);

        context.SaveChanges();

        return;

        if (context.Nodes.Any()) return; // Данные уже есть

        // Создаем все узлы

        // Вопросы
        var q1 = new Node { Type = "Question", QuestionText = "Необходимо независимое развертывание компонентов?" };
        var qScale = new Node { Type = "Question", QuestionText = "Высокая нагрузка / горизонтальное масштабирование?" };
        var qDomainLow = new Node { Type = "Question", QuestionText = "Сложность предметной области?" };
        var qTeamLowSmall = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var qTeamLowHigh = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var qACID = new Node { Type = "Question", QuestionText = "Строгая ACID-транзакционность?" };
        var qDomainACID = new Node { Type = "Question", QuestionText = "Сложность домена?" };
        var qTimeACID = new Node { Type = "Question", QuestionText = "Скорость вывода на рынок?" };
        var qTeamACID = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var qDomainNoIndep = new Node { Type = "Question", QuestionText = "Сложность домена?" };
        var qTeamNoIndepSmall = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var qTeamNoIndepHigh = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var q2 = new Node { Type = "Question", QuestionText = "Строгая ACID-транзакционность критична?" };
        var qDomainHigh = new Node { Type = "Question", QuestionText = "Сложность предметной области?" };
        var qTeamACIDIndep = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var qTeamACIDHigh = new Node { Type = "Question", QuestionText = "Размер команды?" };
        var q5 = new Node { Type = "Question", QuestionText = "Требуется масштабирование по нагрузке отдельных компонентов?" };
        var q6 = new Node { Type = "Question", QuestionText = "Бюджет и время ограничены?" };
        var qDomainScale = new Node { Type = "Question", QuestionText = "Сложность предметной области?" };

        // Ответы
        var monoSimple = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит",
            Patterns = new List<string> { "MVC", "Vertical Slice", "N-tier", "Repository" }
        };
        var monoClean = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит",
            Patterns = new List<string> { "Clean Architecture", "Onion", "DDD", "CQRS" }
        };
        var monoDDD = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с DDD",
            Patterns = new List<string> { "DDD", "Event Sourcing", "CQRS", "Clean" }
        };
        var modMono = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Модульный монолит",
            Patterns = new List<string> { "DDD", "Modular", "CQRS", "Event Sourcing" }
        };
        var acidFastMono = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с кластеризацией",
            Patterns = new List<string> { "MVC", "Clean", "DDD", "CQRS", "Load Balancer", "Cache" }
        };
        var acidSlowServices = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Микросервисы с сагами",
            Patterns = new List<string> { "CQRS", "Event Sourcing", "Saga", "Orchestration", "API Gateway" }
        };
        var acidComplexSmall = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Модульный монолит",
            Patterns = new List<string> { "DDD", "CQRS", "Event Sourcing", "Saga in-process" }
        };
        var acidComplexLarge = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Микросервисы с DDD и сагами",
            Patterns = new List<string> { "DDD", "BFF", "API Gateway", "CQRS", "Event Sourcing", "Saga" }
        };
        var noIndepSimpleSmall = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Модульный монолит",
            Patterns = new List<string> { "DDD", "Modular" }
        };
        var noIndepSimpleLarge = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с чёткими модулями",
            Patterns = new List<string> { "DDD", "Clean", "CQRS" }
        };
        var noIndepHighSmall = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Модульный монолит с DDD",
            Patterns = new List<string> { "DDD", "Event Sourcing", "CQRS" }
        };
        var noIndepHighLarge = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Микросервисы с ограниченными контекстами",
            Patterns = new List<string> { "DDD", "CQRS", "Event Sourcing", "API Gateway" }
        };
        var a2 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с ACID",
            Patterns = new List<string> { "Layered", "DDD", "Clean", "Unit of Work", "Repository", "CQRS", "Event Sourcing", "ACID" }
        };
        var a1 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Модульный монолит с распределёнными транзакциями",
            Patterns = new List<string> { "DDD", "Bounded Context", "Clean", "CQRS", "Event Sourcing", "Saga", "2PC", "DTC" }
        };
        var a7 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с DDD и ACID",
            Patterns = new List<string> { "DDD", "Clean", "Vertical Slice", "CQRS", "Event Sourcing", "Repository", "ACID" }
        };
        var a5_var = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Микросервисы с DDD и сагами",
            Patterns = new List<string> { "Database per Service", "DDD", "CQRS", "Event Sourcing", "Saga", "API Gateway", "BFF", "Circuit Breaker", "Service Discovery", "Distributed Tracing" }
        };
        var a4 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с выделением модулей для будущего перехода",
            Patterns = new List<string> { "Modular Monolith", "DDD", "Bounded Context", "Strangler Fig", "Anti-Corruption Layer" }
        };
        var a5 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Микросервисы",
            Patterns = new List<string> { "Database per Service", "CQRS", "Event Sourcing", "Saga", "API Gateway", "BFF", "Circuit Breaker", "Retry", "Service Discovery", "Sidecar", "Strangler Fig", "Distributed Tracing" }
        };
        var a3 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с горизонтальным масштабированием",
            Patterns = new List<string> { "Layered", "MVC", "CQRS", "Cache", "Load Balancer", "Read Replicas", "Repository", "Connection Pooling" }
        };
        var a9 = new Node
        {
            Type = "Answer",
            ArchitectureStyle = "Монолит с DDD и горизонтальным масштабированием",
            Patterns = new List<string> { "DDD", "Bounded Context", "Clean", "CQRS", "Event Sourcing", "Cache", "Load Balancer", "Read Replicas" }
        };

        // Собираем все узлы в список
        var nodes = new List<Node>
        {
            q1, qScale, qDomainLow, qTeamLowSmall, qTeamLowHigh, qACID, qDomainACID, qTimeACID, qTeamACID,
            qDomainNoIndep, qTeamNoIndepSmall, qTeamNoIndepHigh, q2, qDomainHigh, qTeamACIDIndep, qTeamACIDHigh,
            q5, q6, qDomainScale,
            monoSimple, monoClean, monoDDD, modMono, acidFastMono, acidSlowServices, acidComplexSmall, acidComplexLarge,
            noIndepSimpleSmall, noIndepSimpleLarge, noIndepHighSmall, noIndepHighLarge,
            a2, a1, a7, a5_var, a4, a5, a3, a9
        };

        context.Nodes.AddRange(nodes);
        context.SaveChanges(); // Теперь у всех узлов есть Id

        // Создаем связи

        var links = new List<Link>();

        // Q1 -> QScale (Нет)
        links.Add(new Link { ParentId = q1.Id, Condition = "Нет", ChildId = qScale.Id });
        // Q1 -> Q2 (Да)
        links.Add(new Link { ParentId = q1.Id, Condition = "Да", ChildId = q2.Id });

        // Ветка "Нет" от Q1
        // QScale -> QDomainLow (Нет)
        links.Add(new Link { ParentId = qScale.Id, Condition = "Нет", ChildId = qDomainLow.Id });
        // QScale -> QACID (Да)
        links.Add(new Link { ParentId = qScale.Id, Condition = "Да", ChildId = qACID.Id });

        // Подветка низкой нагрузки (QDomainLow)
        // QDomainLow -> QTeamLowSmall (Низкая)
        links.Add(new Link { ParentId = qDomainLow.Id, Condition = "Низкая", ChildId = qTeamLowSmall.Id });
        // QDomainLow -> QTeamLowHigh (Высокая)
        links.Add(new Link { ParentId = qDomainLow.Id, Condition = "Высокая", ChildId = qTeamLowHigh.Id });

        // QTeamLowSmall
        links.Add(new Link { ParentId = qTeamLowSmall.Id, Condition = "≤ 5", ChildId = monoSimple.Id });
        links.Add(new Link { ParentId = qTeamLowSmall.Id, Condition = "> 5", ChildId = monoClean.Id });

        // QTeamLowHigh
        links.Add(new Link { ParentId = qTeamLowHigh.Id, Condition = "≤ 5", ChildId = monoDDD.Id });
        links.Add(new Link { ParentId = qTeamLowHigh.Id, Condition = "> 5", ChildId = modMono.Id });

        // Подветка высокой нагрузки (QACID)
        // QACID -> QDomainACID (Да)
        links.Add(new Link { ParentId = qACID.Id, Condition = "Да", ChildId = qDomainACID.Id });
        // QACID -> QDomainNoIndep (Нет)
        links.Add(new Link { ParentId = qACID.Id, Condition = "Нет", ChildId = qDomainNoIndep.Id });

        // QDomainACID
        // QDomainACID -> QTimeACID (Низкая)
        links.Add(new Link { ParentId = qDomainACID.Id, Condition = "Низкая", ChildId = qTimeACID.Id });
        // QDomainACID -> QTeamACID (Высокая)
        links.Add(new Link { ParentId = qDomainACID.Id, Condition = "Высокая", ChildId = qTeamACID.Id });

        // QTimeACID
        links.Add(new Link { ParentId = qTimeACID.Id, Condition = "Быстро", ChildId = acidFastMono.Id });
        links.Add(new Link { ParentId = qTimeACID.Id, Condition = "Не критично", ChildId = acidSlowServices.Id });

        // QTeamACID
        links.Add(new Link { ParentId = qTeamACID.Id, Condition = "≤ 5", ChildId = acidComplexSmall.Id });
        links.Add(new Link { ParentId = qTeamACID.Id, Condition = "> 5", ChildId = acidComplexLarge.Id });

        // QDomainNoIndep
        // QDomainNoIndep -> QTeamNoIndepSmall (Низкая)
        links.Add(new Link { ParentId = qDomainNoIndep.Id, Condition = "Низкая", ChildId = qTeamNoIndepSmall.Id });
        // QDomainNoIndep -> QTeamNoIndepHigh (Высокая)
        links.Add(new Link { ParentId = qDomainNoIndep.Id, Condition = "Высокая", ChildId = qTeamNoIndepHigh.Id });

        // QTeamNoIndepSmall
        links.Add(new Link { ParentId = qTeamNoIndepSmall.Id, Condition = "≤ 5", ChildId = noIndepSimpleSmall.Id });
        links.Add(new Link { ParentId = qTeamNoIndepSmall.Id, Condition = "> 5", ChildId = noIndepSimpleLarge.Id });

        // QTeamNoIndepHigh
        links.Add(new Link { ParentId = qTeamNoIndepHigh.Id, Condition = "≤ 5", ChildId = noIndepHighSmall.Id });
        links.Add(new Link { ParentId = qTeamNoIndepHigh.Id, Condition = "> 5", ChildId = noIndepHighLarge.Id });

        // Ветка "Да" от Q1
        // Q2 -> QDomainHigh (Да)
        links.Add(new Link { ParentId = q2.Id, Condition = "Да", ChildId = qDomainHigh.Id });
        // Q2 -> Q5 (Нет)
        links.Add(new Link { ParentId = q2.Id, Condition = "Нет", ChildId = q5.Id });

        // QDomainHigh
        // QDomainHigh -> QTeamACIDIndep (Низкая)
        links.Add(new Link { ParentId = qDomainHigh.Id, Condition = "Низкая", ChildId = qTeamACIDIndep.Id });
        // QDomainHigh -> QTeamACIDHigh (Высокая)
        links.Add(new Link { ParentId = qDomainHigh.Id, Condition = "Высокая", ChildId = qTeamACIDHigh.Id });

        // QTeamACIDIndep
        links.Add(new Link { ParentId = qTeamACIDIndep.Id, Condition = "≤ 5", ChildId = a2.Id });
        links.Add(new Link { ParentId = qTeamACIDIndep.Id, Condition = "> 5", ChildId = a1.Id });

        // QTeamACIDHigh
        links.Add(new Link { ParentId = qTeamACIDHigh.Id, Condition = "≤ 5", ChildId = a7.Id });
        links.Add(new Link { ParentId = qTeamACIDHigh.Id, Condition = "> 5", ChildId = a5_var.Id });

        // Q5
        // Q5 -> Q6 (Да)
        links.Add(new Link { ParentId = q5.Id, Condition = "Да", ChildId = q6.Id });
        // Q5 -> QDomainScale (Нет)
        links.Add(new Link { ParentId = q5.Id, Condition = "Нет", ChildId = qDomainScale.Id });

        // Q6
        links.Add(new Link { ParentId = q6.Id, Condition = "Да", ChildId = a4.Id });
        links.Add(new Link { ParentId = q6.Id, Condition = "Нет", ChildId = a5.Id });

        // QDomainScale
        // QDomainScale -> A3 (Низкая)
        links.Add(new Link { ParentId = qDomainScale.Id, Condition = "Низкая", ChildId = a3.Id });
        // QDomainScale -> A9 (Высокая)
        links.Add(new Link { ParentId = qDomainScale.Id, Condition = "Высокая", ChildId = a9.Id });

        context.Links.AddRange(links);
        context.SaveChanges();
    }
}
