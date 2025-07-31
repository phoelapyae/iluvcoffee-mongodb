import { Injectable, NotFoundException } from '@nestjs/common';
import { Coffee } from './entities/coffee.entities';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CreateCoffeeDto } from './dto/create-coffee.dto/create-coffee.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query/pagination-query.dto';

@Injectable()
export class CoffeesService {
    constructor(
        @InjectModel(Coffee.name) private readonly coffeeModel: Model<Coffee>,
        @InjectConnection() private readonly connection: Connection,
        @InjectModel(Event.name) private readonly eventMovel: Model<Event>
    ) { }

    findAll(paginationQuery: PaginationQueryDto) {
        const { offset, limit } = paginationQuery;
        return this.coffeeModel.find().skip(offset).limit(limit).exec();
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid ID format`);
        }

        const coffee = await this.coffeeModel.findOne({ _id: new Types.ObjectId(id) }).exec();

        if (!coffee) {
            throw new NotFoundException(`Coffee #${id} not found.`)
        }

        return coffee;
    }

    create(createCoffeeDto: CreateCoffeeDto) {
        const coffee = new this.coffeeModel((createCoffeeDto));
        return coffee.save();
    }

    async update(id: string, updateCoffeeDto: any) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid ID format`);
        }

        const existingCoffee = await this.coffeeModel
            .findOneAndUpdate(
                { _id: new Types.ObjectId(id) },
                { $set: updateCoffeeDto },
                { new: true }
            )
            .exec();
        
        if (!existingCoffee) {
            throw new NotFoundException(`Coffee #${id} not found.`);
        }

        return existingCoffee;
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid ID format`);
        }
        return this.coffeeModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    }

    async recommendCoffee(coffee: Coffee) {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            coffee.recommendations++;
            const recommendEvent = new this.eventMovel({
                name: 'recommend_coffee',
                type: 'coffee',
                payload: { coffeeId: coffee.id}
            })
            await recommendEvent.save({ session });
            await coffee.save({ session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
        } finally {
            session.endSession();
        }
    }
}