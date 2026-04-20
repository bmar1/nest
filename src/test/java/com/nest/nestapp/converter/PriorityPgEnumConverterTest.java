package com.nest.nestapp.converter;

import com.nest.nestapp.model.Priority;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

class PriorityPgEnumConverterTest {

    private final PriorityPgEnumConverter converter = new PriorityPgEnumConverter();

    @ParameterizedTest
    @EnumSource(Priority.class)
    void convertToDatabaseColumn_allValues_returnStringName(Priority priority) {
        String result = converter.convertToDatabaseColumn(priority);
        assertNotNull(result);
        assertEquals(priority.name(), result,
                "Converter should return the enum name as a plain String");
    }

    @Test
    void convertToDatabaseColumn_null_returnsNull() {
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @ParameterizedTest
    @EnumSource(Priority.class)
    void convertToEntityAttribute_validString_returnsEnum(Priority expected) {
        Priority result = converter.convertToEntityAttribute(expected.name());
        assertEquals(expected, result);
    }

    @Test
    void convertToEntityAttribute_null_returnsNull() {
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void convertToEntityAttribute_invalid_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> converter.convertToEntityAttribute("NONEXISTENT"));
    }

    @Test
    void roundTrip_balanced() {
        // This is the exact value that caused the 500 error
        String dbValue = converter.convertToDatabaseColumn(Priority.BALANCED);
        assertEquals("BALANCED", dbValue);
        Priority restored = converter.convertToEntityAttribute(dbValue);
        assertEquals(Priority.BALANCED, restored);
    }
}
