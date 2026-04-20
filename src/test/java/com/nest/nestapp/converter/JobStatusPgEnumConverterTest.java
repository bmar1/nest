package com.nest.nestapp.converter;

import com.nest.nestapp.model.JobStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

class JobStatusPgEnumConverterTest {

    private final JobStatusPgEnumConverter converter = new JobStatusPgEnumConverter();

    @ParameterizedTest
    @EnumSource(JobStatus.class)
    void convertToDatabaseColumn_allValues_returnStringName(JobStatus status) {
        String result = converter.convertToDatabaseColumn(status);
        assertNotNull(result);
        assertEquals(status.name(), result,
                "Converter should return the enum name as a plain String");
    }

    @Test
    void convertToDatabaseColumn_null_returnsNull() {
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @ParameterizedTest
    @EnumSource(JobStatus.class)
    void convertToEntityAttribute_validString_returnsEnum(JobStatus expected) {
        JobStatus result = converter.convertToEntityAttribute(expected.name());
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
    void roundTrip_pending() {
        String dbValue = converter.convertToDatabaseColumn(JobStatus.PENDING);
        assertEquals("PENDING", dbValue);
        JobStatus restored = converter.convertToEntityAttribute(dbValue);
        assertEquals(JobStatus.PENDING, restored);
    }
}
