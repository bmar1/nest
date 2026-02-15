package com.nest.nestapp.dto;

import com.nest.nestapp.model.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResponseDto {
    private UUID searchId;
    private JobStatus status;
    private String pollingUrl;
    private Integer estimatedWaitSeconds;
}
