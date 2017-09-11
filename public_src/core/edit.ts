export interface IEdit {
    change: {
        key?: any;
        value?: any;
        from?: any;
        to?: any;
    };
    id: number;
    geometryType: string;
    type: string;
}
