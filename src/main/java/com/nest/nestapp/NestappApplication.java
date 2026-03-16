package com.nest.nestapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NestappApplication {

	public static void main(String[] args) {
		SpringApplication.run(NestappApplication.class, args);
	}

}
