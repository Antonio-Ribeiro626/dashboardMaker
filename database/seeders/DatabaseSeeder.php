<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::create(['name' => 'OnBoarding', 'industry' => 'Retail e servicos', 'employees_count' => 32, 'plan' => 'Business', 'logo' => 'OB']);

        foreach ([['Administrador','admin@onboarding.local','admin'], ['Gestor','gestor@onboarding.local','manager'], ['Operador','operador@onboarding.local','employee']] as [$name,$email,$role]) {
            User::create(['company_id' => $company->id, 'name' => $name, 'email' => $email, 'role' => $role, 'password' => env('SEED_USER_PASSWORD', 'ChangeMe123!')]);
        }

        $statuses = ['active','active','active','lead','inactive'];
        for ($i = 1; $i <= 20; $i++) {
            Customer::create(['company_id' => $company->id, 'name' => "Cliente $i", 'email' => "cliente$i@onboarding.local", 'phone' => '+351 91'.str_pad((string) $i, 7, '0'), 'status' => $statuses[array_rand($statuses)], 'created_at' => now()->subDays(rand(1, 330)), 'updated_at' => now()]);
        }

        $categories = ['Software','Consultoria','Formacao','Hardware','Suporte'];
        for ($i = 1; $i <= 20; $i++) {
            Product::create(['company_id' => $company->id, 'name' => "Produto $i", 'category' => $categories[array_rand($categories)], 'price' => rand(2500, 25000) / 10, 'stock' => rand(3, 120)]);
        }

        $customers = Customer::all(); $products = Product::all();
        for ($i = 1; $i <= 100; $i++) {
            $product = $products->random(); $quantity = rand(1, 6);
            Sale::create(['company_id' => $company->id, 'customer_id' => $customers->random()->id, 'product_id' => $product->id, 'quantity' => $quantity, 'total' => $product->price * $quantity, 'sale_date' => now()->subDays(rand(0, 350))->toDateString(), 'status' => ['paid','pending','paid','paid'][array_rand(['paid','pending','paid','paid'])]]);
        }

        foreach (['Marketing','Operacoes','Salarios','Cloud','Logistica'] as $category) {
            for ($i = 1; $i <= 6; $i++) {
                Expense::create(['company_id' => $company->id, 'title' => "$category $i", 'category' => $category, 'amount' => rand(4000, 35000) / 10, 'expense_date' => now()->subDays(rand(0, 350))->toDateString()]);
            }
        }

        foreach (range(1, 10) as $i) {
            Employee::create(['company_id' => $company->id, 'name' => "Funcionario $i", 'email' => "funcionario$i@onboarding.local", 'role' => ['Analista','Comercial','Designer','Suporte'][array_rand(['Analista','Comercial','Designer','Suporte'])], 'department' => ['BI','Vendas','Produto','Operacoes'][array_rand(['BI','Vendas','Produto','Operacoes'])]]);
        }

        foreach ([['Stock baixo','Alguns produtos precisam de reposicao.','warning'], ['Despesas elevadas','As despesas de cloud cresceram este mes.','danger'], ['Receita saudavel','A receita mensal esta acima do esperado.','success'], ['Importacao concluida','Os dados iniciais foram carregados.','success']] as [$title,$message,$type]) {
            Notification::create(['company_id' => $company->id, 'title' => $title, 'message' => $message, 'type' => $type, 'is_read' => false]);
        }
    }
}
