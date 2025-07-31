import { Transform, Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class PaginationQueryDto {
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    @Transform(({value}) => parseInt(value))
    limit: number;

    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    @Transform(({value}) => parseInt(value))
    offset: number;
}