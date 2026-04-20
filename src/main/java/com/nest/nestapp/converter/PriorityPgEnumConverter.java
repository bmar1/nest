package com.nest.nestapp.converter;

import com.nest.nestapp.model.Priority;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converts {@link Priority} to/from a {@code String} for the PostgreSQL
 * {@code priority_type} enum column.
 *
 * Hibernate 6.x cannot bind {@code PGobject} through the standard JDBC
 * {@code setObject} path – it picks an unsupported JDBC type code, which
 * causes "Unsupported Types value: 1,265,094,477".
 *
 * Returning a plain {@code String} lets the PostgreSQL driver handle the
 * implicit cast from {@code text → priority_type} as long as the column
 * definition includes an explicit cast or the value matches an enum label.
 */
@Converter(autoApply = false)
public class PriorityPgEnumConverter implements AttributeConverter<Priority, String> {

    @Override
    public String convertToDatabaseColumn(Priority attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public Priority convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Priority.valueOf(dbData);
    }
}
