'use server';

import { sql } from '@vercel/postgres';
import { type Store, type StoreProfile, type StoreStatusKey, type TaskStatusKey } from '@/lib/schema';
import { generateDefaultTasks } from '@/lib/defaultTasks';

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

export async function updateStoreProfile(storeId: string, profile: StoreProfile): Promise<void> {
  const b = (v: boolean) => (v ? 'true' : 'false');
  await sql`
    UPDATE store_profiles SET
      customer_code               = ${profile.customerCode},
      name                        = ${profile.name},
      company_name                = ${profile.companyName},
      business_type               = ${profile.businessType},
      address                     = ${profile.address},
      phone                       = ${profile.phone},
      manager_name                = ${profile.managerName},
      payment_method              = ${profile.paymentMethod},
      collection_person           = ${profile.collectionPerson},
      delivery_time_start         = ${profile.deliveryTimeStart},
      delivery_time_end           = ${profile.deliveryTimeEnd},
      has_lunch                   = ${b(profile.hasLunch)},
      order_method                = ${profile.orderMethod},
      holidays                    = ${profile.holidays},
      misc_collection             = ${b(profile.miscCollection)},
      misc_collection_start       = ${profile.miscCollectionStart},
      first_delivery_date         = ${profile.firstDeliveryDate},
      open_date                   = ${profile.openDate},
      smoking_policy              = ${profile.smokingPolicy},
      delivery_notes              = ${profile.deliveryNotes},
      special_notes               = ${profile.specialNotes},
      invoice_type                = ${profile.invoiceType},
      server_install_date         = ${profile.serverInstallDate},
      handover_date               = ${profile.handoverDate},
      account_change_empty_return = ${b(profile.accountChangeEmptyReturn)},
      elevator_available          = ${b(profile.elevatorAvailable)},
      dedicated_entrance          = ${b(profile.dedicatedEntrance)},
      notes_and_attachments       = ${profile.notesAndAttachments},
      seat_count                  = ${profile.seatCount},
      avg_spend_per_customer      = ${profile.avgSpendPerCustomer},
      expected_sales              = ${profile.expectedSales},
      web_order                   = ${b(profile.webOrder)},
      sponsorship                 = ${b(profile.sponsorship)},
      new_store                   = ${b(profile.newStore)},
      misc_bottle                 = ${b(profile.miscBottle)},
      key_custody                 = ${b(profile.keyCustody)},
      congratulatory_flowers      = ${b(profile.congratulatoryFlowers)},
      proxy_delivery              = ${b(profile.proxyDelivery)},
      customer_work_start_weekday = ${profile.customerWorkStartWeekday},
      customer_work_end_weekday   = ${profile.customerWorkEndWeekday},
      customer_work_start_weekend = ${profile.customerWorkStartWeekend},
      customer_work_end_weekend   = ${profile.customerWorkEndWeekend},
      pane2_memo                  = ${profile.pane2Memo}
    WHERE store_id = ${storeId};
  `;
}

export async function updateTaskDetail(taskId: string, memo: string, dueDate: string): Promise<void> {
  await sql`UPDATE tasks SET memo = ${memo}, due_date = ${dueDate} WHERE id = ${taskId};`;
}

export async function createStore(id: string, profile: StoreProfile): Promise<void> {
  const b = (v: boolean) => (v ? 'true' : 'false');
  const tasks = generateDefaultTasks(id);

  // 1. stores テーブル
  await sql`INSERT INTO stores (id, status) VALUES (${id}, 'notStarted');`;

  // 2. store_profiles テーブル（updateStoreProfile と同カラム、INSERT 版）
  await sql`
    INSERT INTO store_profiles (
      store_id, customer_code, name, company_name, business_type,
      address, phone, manager_name, payment_method, collection_person,
      delivery_time_start, delivery_time_end, has_lunch, order_method, holidays,
      misc_collection, misc_collection_start, first_delivery_date, open_date,
      smoking_policy, delivery_notes, special_notes, invoice_type,
      server_install_date, handover_date, account_change_empty_return,
      elevator_available, dedicated_entrance, notes_and_attachments,
      seat_count, avg_spend_per_customer, expected_sales,
      web_order, sponsorship, new_store, misc_bottle, key_custody,
      congratulatory_flowers, proxy_delivery,
      customer_work_start_weekday, customer_work_end_weekday,
      customer_work_start_weekend, customer_work_end_weekend, pane2_memo
    ) VALUES (
      ${id},
      ${profile.customerCode}, ${profile.name}, ${profile.companyName}, ${profile.businessType},
      ${profile.address}, ${profile.phone}, ${profile.managerName}, ${profile.paymentMethod}, ${profile.collectionPerson},
      ${profile.deliveryTimeStart}, ${profile.deliveryTimeEnd}, ${b(profile.hasLunch)}, ${profile.orderMethod}, ${profile.holidays},
      ${b(profile.miscCollection)}, ${profile.miscCollectionStart}, ${profile.firstDeliveryDate}, ${profile.openDate},
      ${profile.smokingPolicy}, ${profile.deliveryNotes}, ${profile.specialNotes}, ${profile.invoiceType},
      ${profile.serverInstallDate}, ${profile.handoverDate}, ${b(profile.accountChangeEmptyReturn)},
      ${b(profile.elevatorAvailable)}, ${b(profile.dedicatedEntrance)}, ${profile.notesAndAttachments},
      ${profile.seatCount}, ${profile.avgSpendPerCustomer}, ${profile.expectedSales},
      ${b(profile.webOrder)}, ${b(profile.sponsorship)}, ${b(profile.newStore)}, ${b(profile.miscBottle)}, ${b(profile.keyCustody)},
      ${b(profile.congratulatoryFlowers)}, ${b(profile.proxyDelivery)},
      ${profile.customerWorkStartWeekday}, ${profile.customerWorkEndWeekday},
      ${profile.customerWorkStartWeekend}, ${profile.customerWorkEndWeekend}, ${profile.pane2Memo}
    );
  `;

  // 3. tasks + subtasks テーブル
  for (const task of tasks) {
    await sql`
      INSERT INTO tasks (
        id, store_id, name, kind, status, due_date,
        requires_web_order, requires_proxy_delivery, requires_congratulatory_flowers,
        requires_key_custody, requires_sponsorship, requires_new_store, requires_misc_bottle
      ) VALUES (
        ${task.id}, ${id}, ${task.name}, ${task.kind}, ${task.status}, ${task.dueDate},
        ${b(task.requiresWebOrder ?? false)}, ${b(task.requiresProxyDelivery ?? false)},
        ${b(task.requiresCongratulatoryFlowers ?? false)}, ${b(task.requiresKeyCustody ?? false)},
        ${b(task.requiresSponsorship ?? false)}, ${b(task.requiresNewStore ?? false)},
        ${b(task.requiresMiscBottle ?? false)}
      );
    `;

    for (const sub of task.subtasks ?? []) {
      await sql`
        INSERT INTO subtasks (id, task_id, name, completed, requires_misc_bottle, pin_bottom)
        VALUES (
          ${sub.id}, ${task.id}, ${sub.name}, ${b(sub.completed)},
          ${b(sub.requiresMiscBottle ?? false)}, ${b(sub.pinBottom ?? false)}
        );
      `;
    }
  }
}
