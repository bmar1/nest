package com.nest.nestapp.converter;

import com.nest.nestapp.model.JobStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.postgresql.util.PGobject;

import java.sql.SQLException;

/**
 * Binds {@link JobStatus} to PostgreSQL {@code job_status_type} (native enum), not varchar.
 */
@Converter(autoApply = false)
public class JobStatusPgEnumConverter implements AttributeConverter<JobStatus, Object> {

    private static final String PG_TYPE = "job_status_type";

    @Override
    public Object convertToDatabaseColumn(JobStatus attribute) {
        if (attribute == null) {
            return null;
        }
        PGobject pg = new PGobject();
        try {
            pg.setType(PG_TYPE);
            pg.setValue(attribute.name());
        } catch (SQLException e) {
            throw new IllegalStateException("Could not map job status to PostgreSQL enum", e);
        }
        return pg;
    }

    @Override
    public JobStatus convertToEntityAttribute(Object dbData) {
        if (dbData == null) {
            return null;
        }
        if (dbData instanceof PGobject pg) {
            return JobStatus.valueOf(pg.getValue());
        }
        if (dbData instanceof String s) {
            return JobStatus.valueOf(s);
        }
        throw new IllegalArgumentException(
                "Unexpected JDBC value for job_status_type: " + dbData.getClass().getName());
    }
}
