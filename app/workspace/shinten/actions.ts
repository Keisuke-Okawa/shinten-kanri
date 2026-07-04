'use server';

import { sql } from '@vercel/postgres';
import { type Store, type StoreStatusKey, type TaskStatusKey } from '@/lib/schema';

export async function getWorkspaceData(): Promise<Store[]> {
  try {
    const { rows: dbStores } = await sql`SELECT * FROM stores ORDER BY id;`;
    const { rows: dbProfiles } = await sql`SELECT * FROM store_profiles;`;
    const { rows: dbTasks } = await sql`SELECT * FROM tasks ORDER BY store_id, id;`;
    const { rows: dbSubtasks } = await sql`SELECT * FROM subtasks ORDER BY task_id, id;`;

    return dbStores.map((s) => {
      const profile = dbProfiles.find((p) => p.store_id === s.id) ?? {};
      const storeTasks = dbTasks
        .filter((t) => t.store_id === s.id)
        .map((t) => {
          const subtasks = dbSubtasks
            .filter((st) => st.task_id === t.id)
            .map((st) => ({
              id: st.id as string,
              name: st.name as string,
              completed: st.completed === 'true',
              requiresMiscBottle: st.requires_misc_bottle === 'true' ? true : undefined,
              pinBottom: st.pin_bottom === 'true' ? true : undefined,
            }));

          return {
            id: t.id as string,
            name: t.name as string,
            kind: t.kind as 'standard' | 'vehicleReport',
            status: t.status as TaskStatusKey,
            dueDate: (t.due_date as string) ?? '',
            memo: (t.memo as string) || undefined,
            subtasks,
            requiresWebOrder: t.requires_web_order === 'true' ? true : undefined,
            requiresProxyDelivery: t.requires_proxy_delivery === 'true' ? true : undefined,
            requiresCongratulatoryFlowers:
              t.requires_congratulatory_flowers === 'true' ? true : undefined,
            requiresKeyCustody: t.requires_key_custody === 'true' ? true : undefined,
            requiresSponsorship: t.requires_sponsorship === 'true' ? true : undefined,
            requiresNewStore: t.requires_new_store === 'true' ? true : undefined,
            requiresMiscBottle: t.requires_misc_bottle === 'true' ? true : undefined,
          };
        });

      return {
        id: s.id as string,
        status: s.status as StoreStatusKey,
        profile: {
          customerCode: (profile.customer_code as string) ?? '',
          name: (profile.name as string) ?? '',
          companyName: (profile.company_name as string) ?? '',
          businessType: (profile.business_type as string) ?? '',
          address: (profile.address as string) ?? '',
          phone: (profile.phone as string) ?? '',
          managerName: (profile.manager_name as string) ?? '',
          paymentMethod: (profile.payment_method as string) ?? '',
          collectionPerson: (profile.collection_person as string) ?? '',
          deliveryTimeStart: (profile.delivery_time_start as string) ?? '',
          deliveryTimeEnd: (profile.delivery_time_end as string) ?? '',
          hasLunch: profile.has_lunch === 'true',
          orderMethod: (profile.order_method as string) ?? '',
          holidays: (profile.holidays as string) ?? '',
          miscCollection: profile.misc_collection === 'true',
          miscCollectionStart: (profile.misc_collection_start as string) ?? '',
          firstDeliveryDate: (profile.first_delivery_date as string) ?? '',
          openDate: (profile.open_date as string) ?? '',
          smokingPolicy: (profile.smoking_policy as string) ?? '',
          deliveryNotes: (profile.delivery_notes as string) ?? '',
          specialNotes: (profile.special_notes as string) ?? '',
          invoiceType: (profile.invoice_type as string) ?? '',
          serverInstallDate: (profile.server_install_date as string) ?? '',
          handoverDate: (profile.handover_date as string) ?? '',
          accountChangeEmptyReturn: profile.account_change_empty_return === 'true',
          elevatorAvailable: profile.elevator_available === 'true',
          dedicatedEntrance: profile.dedicated_entrance === 'true',
          notesAndAttachments: (profile.notes_and_attachments as string) ?? '',
          seatCount: (profile.seat_count as string) ?? '',
          avgSpendPerCustomer: (profile.avg_spend_per_customer as string) ?? '',
          expectedSales: (profile.expected_sales as string) ?? '',
          webOrder: profile.web_order === 'true',
          sponsorship: profile.sponsorship === 'true',
          newStore: profile.new_store === 'true',
          miscBottle: profile.misc_bottle === 'true',
          keyCustody: profile.key_custody === 'true',
          congratulatoryFlowers: profile.congratulatory_flowers === 'true',
          proxyDelivery: profile.proxy_delivery === 'true',
          customerWorkStartWeekday: (profile.customer_work_start_weekday as string) ?? '',
          customerWorkEndWeekday: (profile.customer_work_end_weekday as string) ?? '',
          customerWorkStartWeekend: (profile.customer_work_start_weekend as string) ?? '',
          customerWorkEndWeekend: (profile.customer_work_end_weekend as string) ?? '',
          pane2Memo: (profile.pane2_memo as string) ?? '',
        },
        tasks: storeTasks,
      };
    });
  } catch (error) {
    console.error('Failed to fetch workspace data from DB:', error);
    return [];
  }
}

export async function updateStoreStatus(storeId: string, status: StoreStatusKey): Promise<void> {
  await sql`UPDATE stores SET status = ${status} WHERE id = ${storeId};`;
}

export async function updateTaskStatus(taskId: string, status: TaskStatusKey): Promise<void> {
  await sql`UPDATE tasks SET status = ${status} WHERE id = ${taskId};`;
}

export async function toggleSubtaskCompleted(subtaskId: string, completed: boolean): Promise<void> {
  const compStr = completed ? 'true' : 'false';
  await sql`UPDATE subtasks SET completed = ${compStr} WHERE id = ${subtaskId};`;
}
