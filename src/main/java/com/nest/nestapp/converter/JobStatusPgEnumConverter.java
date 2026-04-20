package com.nest.nestapp.converter;

import com.nest.nestapp.model.JobStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converts {@link JobStatus} to/from a {@code String} for the PostgreSQL
 * {@code job_status_type} enum column.
 *
 * See {@link PriorityPgEnumConverter} for the rationale behind using
 * {@code String} instead of {@code PGobject}.
 */
@Converter(autoApply = false)
public class JobStatusPgEnumConverter implements AttributeConverter<JobStatus, String> {

    @Override
    public String convertToDatabaseColumn(JobStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public JobStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : JobStatus.valueOf(dbData);
    }
}
