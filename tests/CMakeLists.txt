set ( TARGET tests )

glob_headers_and_sources ( HEADERS SOURCES )

add_executable ( ${TARGET}
	${HEADERS} ${SOURCES}
)

target_include_directories ( ${TARGET}
	PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include"
)

target_link_libraries ( ${TARGET}
	fsm-lib
)

apply_recommended_compile_options ( ${TARGET} )
enable_autoformatter ( ${TARGET} )

add_test (
	NAME ${TARGET}
	COMMAND ${TARGET}
)
