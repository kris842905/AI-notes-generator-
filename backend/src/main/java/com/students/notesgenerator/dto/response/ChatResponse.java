package com.students.notesgenerator.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatResponse {
    private String reply;
    private List<SourceChunkDto> sources;

    public ChatResponse(String reply, List<SourceChunkDto> sources) {
        this.reply = reply;
        this.sources = sources;
    }

    @Getter
    @Setter
    public static class SourceChunkDto {
        private String content;
        private Integer chunkIndex;

        public SourceChunkDto(String content, Integer chunkIndex) {
            this.content = content;
            this.chunkIndex = chunkIndex;
        }
    }
}
