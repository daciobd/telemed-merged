import { db } from '../../db';
import { consultationBids, consultations, doctors } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import queries from '../../db/queries';

interface CreateBidData {
  consultationId: number;
  doctorId: number;
  bidPrice: string;
  message?: string;
}

export class BidService {
  // Criar lance
  async createBid(data: CreateBidData) {
    // Verificar se a consulta existe e está pendente
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, data.consultationId))
      .limit(1);

    if (!consultation) {
      throw new Error('Consulta não encontrada');
    }

    if (consultation.status !== 'pending') {
      throw new Error('Esta consulta não está mais aceitando lances');
    }

    if (!consultation.isMarketplace) {
      throw new Error('Esta consulta não é do marketplace');
    }

    // Verificar se médico já fez lance nesta consulta
    const existingBid = await db
      .select()
      .from(consultationBids)
      .where(
        and(
          eq(consultationBids.consultationId, data.consultationId),
          eq(consultationBids.doctorId, data.doctorId)
        )
      )
      .limit(1);

    if (existingBid.length > 0) {
      throw new Error('Você já fez um lance nesta consulta');
    }

    // Criar lance
    const result = await queries.createBid({
      consultationId: data.consultationId,
      doctorId: data.doctorId,
      bidPrice: data.bidPrice,
      message: data.message,
    });

    return result[0];
  }

  // Listar lances de uma consulta
  async getConsultationBids(consultationId: number) {
    return await queries.getConsultationBids(consultationId);
  }

  // Aceitar lance
  async acceptBid(bidId: number, consultationId: number, patientId: number) {
    // Verificar se o lance existe
    const [bid] = await db
      .select()
      .from(consultationBids)
      .where(eq(consultationBids.id, bidId))
      .limit(1);

    if (!bid) {
      throw new Error('Lance não encontrado');
    }

    // Verificar se a consulta pertence ao paciente
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.patientId, patientId)
        )
      )
      .limit(1);

    if (!consultation) {
      throw new Error('Consulta não encontrada ou você não tem permissão');
    }

    if (consultation.status !== 'pending') {
      throw new Error('Esta consulta não está mais aceitando lances');
    }

    // Aceitar o lance usando a query do banco
    const result = await queries.acceptBid(bidId, consultationId, bid.doctorId);

    return result;
  }

  // Rejeitar lance
  async rejectBid(bidId: number) {
    const [rejected] = await db
      .update(consultationBids)
      .set({
        isRejected: true,
        respondedAt: new Date(),
      })
      .where(eq(consultationBids.id, bidId))
      .returning();

    if (!rejected) {
      throw new Error('Lance não encontrado');
    }

    return rejected;
  }

  // Buscar lances do médico
  async getDoctorBids(doctorId: number) {
    const bids = await db
      .select({
        bid: consultationBids,
        consultation: consultations,
      })
      .from(consultationBids)
      .innerJoin(
        consultations,
        eq(consultationBids.consultationId, consultations.id)
      )
      .where(eq(consultationBids.doctorId, doctorId))
      .orderBy(consultationBids.createdAt);

    return bids;
  }

  // Atualizar lance (contra-proposta)
  async updateBid(bidId: number, doctorId: number, newPrice: string, message?: string) {
    // Verificar se o lance pertence ao médico
    const [bid] = await db
      .select()
      .from(consultationBids)
      .where(
        and(
          eq(consultationBids.id, bidId),
          eq(consultationBids.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!bid) {
      throw new Error('Lance não encontrado ou você não tem permissão');
    }

    if (bid.isAccepted) {
      throw new Error('Lance já foi aceito, não pode ser alterado');
    }

    if (bid.isRejected) {
      throw new Error('Lance já foi rejeitado');
    }

    // Atualizar lance
    const [updated] = await db
      .update(consultationBids)
      .set({
        bidPrice: newPrice,
        message: message || bid.message,
      })
      .where(eq(consultationBids.id, bidId))
      .returning();

    return updated;
  }
}

export default new BidService();
