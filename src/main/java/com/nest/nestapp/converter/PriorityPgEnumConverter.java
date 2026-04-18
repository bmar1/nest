package com.nest.nestapp.converter;

import com.nest.nestapp.model.Priority;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.postgresql.util.PGobject;

import java.sql.SQLException;

/**
 * Binds {@link Priority} to PostgreSQL {@code priority_type} (native enum), not varchar.
 */
@Converter(autoApply = false)
public class PriorityPgEnumConverter implements AttributeConverter<Priority, Object> {

    private static final String PG_TYPE = "priority_type";

    @Override
    public Object convertToDatabaseColumn(Priority attribute) {
        if (attribute == null) {
            return null;
        }
        PGobject pg = new PGobject();
        try {
            pg.setType(PG_TYPE);
            pg.setValue(attribute.name());
        } catch (SQLException e) {
            throw new IllegalStateException("Could not map priority to PostgreSQL enum", e);
        }
        return pg;
    }

    @Override
    public Priority convertToEntityAttribute(Object dbData) {
        if (dbData == null) {
            return null;
        }
        if (dbData instanceof PGobject pg) {
            return Priority.valueOf(pg.getValue());
        }
        if (dbData instanceof String s) {
            return Priority.valueOf(s);
        }
        throw new IllegalArgumentException(
                "Unexpected JDBC value for priority_type: " + dbData.getClass().getName());
    }
}
