package com.nest.nestapp.dto;

import com.nest.nestapp.model.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultsDto {
    private UUID searchId;
    private JobStatus status;
    private Integer totalApartmentsFound;
    private Integer totalAttempted;
    private Integer totalSuccessful;
    private Integer totalFailed;
    private List<ApartmentDto> apartments;
    private Integer estimatedWaitSeconds;
}
