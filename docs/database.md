```Mermaid
erDiagram
    %% USER & AUTHENTICATION
    USERS {
        int id PK
        string auth_provider_id "Cognito/Clerk User ID"
        string display_name
        string username
        string email
        string role "STUDENT, TEACHER, ADMIN"
        string account_status "ACTIVE, INACTIVE"
        int student_class_id FK "Nullable, populated for Students"
    }

    CLASSES {
        int id PK
        string name
        int teacher_id FK "Points to USERS (exactly 1 Teacher per class)"
    }

    %% LESSONS & CONTENT
    LESSONS {
        int id PK
        string title
        int week_number
        string status "DRAFT, PUBLISHED"
        string student_instructions
        int creator_id FK "Teacher or Admin ID"
        datetime created_at
        datetime updated_at
    }

    CLASS_LESSONS {
        int class_id PK, FK
        int lesson_id PK, FK
    }

    %% NORMALIZED VOCABULARY (Per Section 5 Arch Doc)
    VOCABULARY_CONCEPTS {
        int id PK
        int lesson_id FK
        int order_num
        string primary_meaning
        string context_notes "Nullable"
    }

    CHINESE_EXPRESSIONS {
        int id PK
        int concept_id FK
        string traditional_chinese
        string simplified_chinese "Nullable"
    }

    PRONUNCIATIONS {
        int id PK
        int expression_id FK
        string language "MANDARIN, CANTONESE"
        string romanization_system "PINYIN, JYUTPING"
        string reading
        string audio_s3_key "Nullable, points to S3 bucket"
    }

    EXAMPLE_SENTENCES {
        int id PK
        int concept_id FK
        string traditional_chinese
        string simplified_chinese "Nullable"
        string english_translation
    }

    QUESTIONS {
        int id PK
        int lesson_id FK
        int concept_id FK "Nullable, links to vocab concept"
        string question_type "RECOGNITION, PRONUNCIATION, WRITING"
        int order_num
        string prompt
        string correct_answer
        string options "Nullable JSON, for multiple choice options"
    }

    %% PROGRESS & ATTEMPTS
    LESSON_ATTEMPTS {
        int id PK
        int student_id FK
        int lesson_id FK
        string status "IN_PROGRESS, COMPLETED"
        int score_percent "Nullable"
        int questions_correct "Nullable"
        int total_questions
        datetime started_at
        datetime completed_at "Nullable"
    }

    QUESTION_RESPONSES {
        int id PK
        int attempt_id FK
        int question_id FK
        boolean is_correct
        string student_audio_s3_key "Nullable, points to S3 upload"
        string student_stroke_data "Nullable JSON, for HTML5 Canvas"
        string student_text_answer "Nullable, for RECOGNITION"
        datetime answered_at
    }

    %% RELATIONSHIPS
    USERS }o--o| CLASSES : "enrolled in class (Student)"
    USERS ||--o{ CLASSES : "assigned to teach (Teacher)"

    USERS ||--o{ LESSONS : "authors lesson (Teacher/Admin)"
    LESSONS ||--o{ CLASS_LESSONS : "assigned to whole class"
    CLASSES ||--o{ CLASS_LESSONS : "given to students in class"

    LESSONS ||--o{ VOCABULARY_CONCEPTS : "teaches conceptual meaning"
    VOCABULARY_CONCEPTS ||--o{ CHINESE_EXPRESSIONS : "represented by character(s)"
    VOCABULARY_CONCEPTS ||--o{ EXAMPLE_SENTENCES : "demonstrated in"
    CHINESE_EXPRESSIONS ||--o{ PRONUNCIATIONS : "spoken as"

    LESSONS ||--o{ QUESTIONS : "contains practice questions"
    VOCABULARY_CONCEPTS ||--o{ QUESTIONS : "provides reference for question"

    USERS ||--o{ LESSON_ATTEMPTS : "works on lesson (Student)"
    LESSONS ||--o{ LESSON_ATTEMPTS : "generates progress record"

    LESSON_ATTEMPTS ||--o{ QUESTION_RESPONSES : "saves student answer"
    QUESTIONS ||--o{ QUESTION_RESPONSES : "receives student answer"
```
