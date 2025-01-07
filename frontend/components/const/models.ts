// models.ts
export type Model = {
    id: number;
    name: string;
    description: string;
    model_type: string;
}

export const models: Model[] = [
    {id: 1, name: 'Kiến thức chung', description: 'Hỏi đáp kiến thức chung', model_type: 'wiki'},
    {id: 2, name: 'Pháp luật', description: 'Hỏi đáp về pháp luật', model_type: 'law'},
    {id: 3, name: 'Y tế', description: 'Hỏi đáp về y tế', model_type: 'medical'},
];
