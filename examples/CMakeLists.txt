set ( TARGET "examples-common" )

add_library ( ${TARGET} INTERFACE )
target_include_directories ( ${TARGET}
	INTERFACE "${CMAKE_CURRENT_SOURCE_DIR}/include"
)

target_link_libraries ( ${TARGET}
	INTERFACE fsm-lib
)

function ( execute_example_as_test TARGET )
	if ( BUILD_TESTS )
		add_test (
			NAME "${TARGET}"
			COMMAND "${TARGET}"
		)
	endif ()
endfunction ()

macro ( fsm_lib_add_example NAME )
	add_executable ( ${TARGET}
		"${CMAKE_CURRENT_SOURCE_DIR}/Main.cpp"
	)

	target_link_libraries ( ${TARGET} examples-common )

	apply_recommended_compile_options ( ${TARGET} )
	enable_autoformatter ( ${TARGET} )
	execute_example_as_test ( ${TARGET} )

	set_target_properties( ${TARGET} PROPERTIES FOLDER "examples" )
endmacro ()

add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/01-loggable-blackboard" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/02-simple-fsm" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/03-exporting-diagrams" )
add_subdirectory ( "${CMAKE_CURRENT_SOURCE_DIR}/04-importing-fsms" )
