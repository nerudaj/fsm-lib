#include "Blackboard.hpp"
#include "TestableLogger.hpp"
#include "catch_amalgamated.hpp"
#include <filesystem>
#include <fsm/logging/CsvLogger.hpp>

TEST_CASE("[Logger]")
{
    auto&& loggerInstance = TestableLogger();
    fsm::LoggerInterface& logger = loggerInstance;

    SECTION("Can log loggable blackboard")
    {
        logger.log(0, "", Blackboard {}, "", "");
        REQUIRE(loggerInstance.lastLogBlackboard == "Blackboard: [ charIdx: 0; wordStartIdx: 0; |csv| = 1; |csv.back()| = 0 ]");
        REQUIRE(!loggerInstance.lastLogBlackboardId.empty());
    }

    SECTION("Can log unloggable blackboard")
    {
        logger.log(0, "", NonLoggableBlackboard {}, "", "");
        REQUIRE(loggerInstance.lastLogBlackboard.empty());
        REQUIRE(!loggerInstance.lastLogBlackboardId.empty());
    }

    SECTION("Logs header to given outstream")
    {
        auto stream = std::ostringstream();
        {
            std::ignore = fsm::CsvLogger(stream);
        }

        REQUIRE(stream.str() == "MachineId,BlackboardId,BlackboardLog,Message,CurrentStateName,TargetStateName,Duration (us)\n");
    }

    SECTION("Logs headers to given path")
    {
        {
            std::ignore = fsm::CsvLogger("./log.txt");
        }

        std::string line;

        {
            std::ifstream load("./log.txt");
            std::getline(load, line);
        }

        std::filesystem::remove("./log.txt");

        REQUIRE(line == "MachineId,BlackboardId,BlackboardLog,Message,CurrentStateName,TargetStateName,Duration (us)");
    }
}
