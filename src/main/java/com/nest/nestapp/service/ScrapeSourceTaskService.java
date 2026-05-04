package com.nest.nestapp.service;

import com.nest.nestapp.model.ScrapeSource;
import com.nest.nestapp.model.ScrapeSourceTask;
import com.nest.nestapp.model.ScrapeSourceTaskStatus;
import com.nest.nestapp.repository.ScrapeSourceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScrapeSourceTaskService {

    private static final EnumSet<ScrapeSourceTaskStatus> TERMINAL_STATUSES =
            EnumSet.of(ScrapeSourceTaskStatus.DONE, ScrapeSourceTaskStatus.FAILED);
    private static final EnumSet<ScrapeSourceTaskStatus> NON_TERMINAL_STATUSES =
            EnumSet.of(ScrapeSourceTaskStatus.PENDING, ScrapeSourceTaskStatus.PROCESSING);

    private final ScrapeSourceTaskRepository scrapeSourceTaskRepository;

    public List<ScrapeSource> enabledSources() {
        return Arrays.asList(ScrapeSource.values());
    }

    @Transactional
    public List<ScrapeSourceTask> createTasks(UUID searchId) {
        List<ScrapeSourceTask> tasks = enabledSources().stream()
                .map(source -> ScrapeSourceTask.builder()
                        .searchId(searchId)
                        .source(source)
                        .status(ScrapeSourceTaskStatus.PENDING)
                        .build())
                .toList();
        return scrapeSourceTaskRepository.saveAll(tasks);
    }

    public List<ScrapeSourceTask> findTasks(UUID searchId) {
        return scrapeSourceTaskRepository.findBySearchId(searchId);
    }

    public boolean hasTasks(UUID searchId) {
        return scrapeSourceTaskRepository.countBySearchId(searchId) > 0;
    }

    public boolean allTasksTerminal(UUID searchId) {
        long expectedTaskCount = enabledSources().size();
        long actualTaskCount = scrapeSourceTaskRepository.countBySearchId(searchId);
        if (actualTaskCount != expectedTaskCount) {
            return false;
        }
        return !scrapeSourceTaskRepository.existsBySearchIdAndStatusIn(searchId, NON_TERMINAL_STATUSES);
    }

    public long terminalTaskCount(UUID searchId) {
        return scrapeSourceTaskRepository.countBySearchIdAndStatusIn(searchId, TERMINAL_STATUSES);
    }

    @Transactional
    public void markProcessing(UUID searchId, ScrapeSource source) {
        scrapeSourceTaskRepository.updateStatus(
                searchId,
                source,
                ScrapeSourceTaskStatus.PROCESSING,
                1,
                null
        );
    }

    @Transactional
    public void markDone(UUID searchId, ScrapeSource source) {
        scrapeSourceTaskRepository.updateStatus(
                searchId,
                source,
                ScrapeSourceTaskStatus.DONE,
                0,
                null
        );
    }

    @Transactional
    public void markFailed(UUID searchId, ScrapeSource source, String errorMessage) {
        scrapeSourceTaskRepository.updateStatus(
                searchId,
                source,
                ScrapeSourceTaskStatus.FAILED,
                0,
                errorMessage
        );
    }
}
