package com.nest.nestapp.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WebConfigTest {

    @Test
    void normalizeOrigins_stripsTrailingSlashFromProductionOrigin() {
        String[] origins = WebConfig.normalizeOrigins(new String[]{
                "http://localhost:5173",
                " https://nest-one-eta.vercel.app/ "
        });

        assertThat(origins).containsExactly(
                "http://localhost:5173",
                "https://nest-one-eta.vercel.app"
        );
    }
}
