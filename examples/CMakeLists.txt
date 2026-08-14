cmake_minimum_required ( VERSION 3.26 )

set ( TARGET "examples-common" )

add_library ( ${TARGET} INTERFACE )
target_include_directories ( ${TARGET}
	INTERFACE "${CMAKE_CURRENT_SOURCE_DIR}/include"
)

target_link_libraries ( ${TARGET}
	INTERFACE fsm-lib
)

function ( execute_example_as_test TARGET )
	if ( ${BUILD_TESTS} )
		add_test (
			NAME "${TARGET}"
			COMMAND "${TARGET}"
		)
	endif ()
endfunction ()

add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/01-loggable-blackboard" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/02-simple-fsm" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/03-exporting-diagrams" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/04-importing-fsms" )
