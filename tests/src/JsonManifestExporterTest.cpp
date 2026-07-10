#include "catch_amalgamated.hpp"
#include "fsm/exports/JsonManifestExporter.hpp"
#include <sstream>

TEST_CASE("[JsonManifestExporter]")
{
    SECTION("Correctly exports v1 manifest")
    {
        auto&& sstream = std::stringstream();
        auto&& exporter = fsm::JsonManifestExporter(sstream);
        exporter.writeManifest(
            {"action1", "action2"},
            {"cond1", "cond2"});

        auto&& output = sstream.str();
        REQUIRE(R"({"actions":["action1","action2"],"conditions":["cond1","cond2"],"version":1})"
            == output);
    }
}