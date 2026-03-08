import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from '../address.entity';
import { Repository } from 'typeorm';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';

@Injectable()
export class AddressesService {
  private static readonly countryNameToCode: Record<string, string> = {
    saudiarabia: 'SA',
    ksa: 'SA',
    kingdomofsaudiarabia: 'SA',
    egypt: 'EG',
    uae: 'AE',
    unitedarabemirates: 'AE',
    qatar: 'QA',
    kuwait: 'KW',
    bahrain: 'BH',
    oman: 'OM',
    jordan: 'JO',
  };

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  private normalizeCountry(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new BadRequestException('country is required');
    }

    const compact = trimmed.toLowerCase().replace(/[\s\-_.]/g, '');
    const mapped = AddressesService.countryNameToCode[compact];
    if (mapped) return mapped;

    if (/^[a-z]{2}$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    throw new BadRequestException(
      'country must be a 2-letter ISO code (e.g. SA) or a supported country name',
    );
  }

  async create(userId: number, dto: CreateAddressDto) {
    const existing = await this.addressRepository.findOne({
      where: { user: { id: userId }, isDefault: true },
    });

    const address = this.addressRepository.create({
      ...dto,
      country: this.normalizeCountry(dto.country),
      user: { id: userId },
      isDefault: !existing,
    });
    return this.addressRepository.save(address);
  }

  async findAll(userId: number) {
    return this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOneByUser(userId: number, addressId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, user: { id: userId } },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async update(userId: number, addressId: string, dto: UpdateAddressDto) {
    const address = await this.findOneByUser(userId, addressId);
    Object.assign(address, {
      ...dto,
      country:
        dto.country !== undefined
          ? this.normalizeCountry(dto.country)
          : address.country,
    });
    return this.addressRepository.save(address);
  }

  async remove(userId: number, addressId: string) {
    const address = await this.findOneByUser(userId, addressId);
    await this.addressRepository.remove(address);
    return { message: 'Address removed successfully' };
  }

  async setDefault(userId: number, addressId: string) {
    const address = await this.findOneByUser(userId, addressId);
    await this.addressRepository.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false },
    );
    address.isDefault = true;
    return this.addressRepository.save(address);
  }

  async getOwnedAddressForOrder(userId: number, addressId: string) {
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }
    if (address.user.id !== userId) {
      throw new ForbiddenException('Address does not belong to current user');
    }
    return address;
  }
}
