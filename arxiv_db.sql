create database arxiv_db;
use arxiv_db;

-- Create the user table with telephone column
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),  -- Added the telephone column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_paper_todo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    paper_title VARCHAR(255) NOT NULL,
    doi VARCHAR(255),           -- Added the DOI column
    paper_link VARCHAR(255),     -- Added the paper_link column
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Added updated_at column
    FOREIGN KEY (user_id) REFERENCES user(id),
    
    -- Create a unique constraint on the combination of user_id and doi
    CONSTRAINT unique_user_doi UNIQUE (user_id, doi)
);
ALTER TABLE user_paper_todo
ADD COLUMN published TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_paper_todo
ADD COLUMN rating INT DEFAULT 2;



select * from user;

select * from user_paper_todo;




