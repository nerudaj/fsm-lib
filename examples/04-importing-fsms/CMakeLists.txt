cmake_minimum_required ( VERSION 3.26 )

set ( TARGET "04-importing-fsms" )

add_executable ( ${TARGET}
	"${CMAKE_CURRENT_SOURCE_DIR}/Main.cpp"
)

target_link_libraries ( ${TARGET} examples-common )

apply_compile_options ( ${TARGET} )
enable_autoformatter ( ${TARGET} )
execute_example_as_test ( ${TARGET} )

set_target_properties( ${TARGET} PROPERTIES FOLDER "examples" )
