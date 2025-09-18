export type Paper = {
    title: string;
    published: string;
    created_at: string;
    updated_at?: string;
    in_process_at?: string;
    done_at?: string;
    first_author: string;
    author_affiliation?: string;
    summary: string;
    link: string;
    doi: string;
    status: 'pending' | 'in_progress' | 'completed';
    progress: number;
    rating?: number;
  }
  
  export function setValues(paper:Paper){
    if (paper.status == "pending"){
      paper.in_process_at = '';
      paper.done_at = ''
    }
    else if(paper.status == "in_progress"){
      paper.in_process_at = paper.updated_at
    }
    else if(paper.status == "completed"){
      paper.done_at = paper.updated_at
    }
    else{
      paper.created_at = '';
      paper.in_process_at = '';
      paper.done_at = ''
    }
  }