<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\Rule;

class OnBoardingController extends Controller
{
    private array $map = [
        'customers' => Customer::class,
        'products' => Product::class,
        'sales' => Sale::class,
        'expenses' => Expense::class,
        'employees' => Employee::class,
    ];

    public function login(Request $request)
    {
        $data = $request->validate(['email' => ['required','email'], 'password' => ['required']]);
        $user = User::where('email', $data['email'])->with('company')->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciais invalidas.'], 422);
        }
        return ['token' => $user->createToken('onboarding')->plainTextToken, 'user' => $user];
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string'],
            'email' => ['required','email','unique:users'],
            'password' => ['required','min:6'],
            'company_name' => ['required','string'],
            'industry' => ['nullable','string'],
            'employees_count' => ['nullable','integer','min:1'],
        ]);
        $company = Company::create(['name' => $data['company_name'], 'industry' => $data['industry'] ?? 'Servicos', 'employees_count' => $data['employees_count'] ?? 1, 'plan' => 'Starter']);
        $user = User::create(['company_id' => $company->id, 'name' => $data['name'], 'email' => $data['email'], 'password' => $data['password'], 'role' => 'admin']);
        return ['token' => $user->createToken('onboarding')->plainTextToken, 'user' => $user->load('company')];
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return ['message' => 'Sessao terminada.'];
    }

    public function user(Request $request)
    {
        return $request->user()->load('company');
    }

    public function index(Request $request)
    {
        $resource = $request->segment(2);
        $model = $this->model($resource);
        $query = $model::query()->where('company_id', $request->user()->company_id);
        if ($search = $request->query('search')) {
            $query->where(function (Builder $q) use ($search, $resource) {
                foreach ($this->searchable($resource) as $field) $q->orWhere($field, 'like', "%$search%");
            });
        }
        if ($resource === 'sales') $query->with(['customer:id,name', 'product:id,name,category']);
        return $query->latest('id')->paginate(12);
    }

    public function store(Request $request)
    {
        $resource = $request->segment(2);
        $this->authorizeWrite($request);
        $data = $this->validated($request, $resource);
        $data['company_id'] = $request->user()->company_id;
        $record = $this->model($resource)::create($data);
        if ($resource === 'sales') $this->notify($request->user()->company_id, 'Venda registada', 'Uma nova venda foi adicionada ao painel.', 'success');
        $this->runAutomaticAlerts($request->user()->company_id);
        return response()->json($record, 201);
    }

    public function update(Request $request, string $id)
    {
        $resource = $request->segment(2);
        $this->authorizeWrite($request);
        $record = $this->model($resource)::where('company_id', $request->user()->company_id)->findOrFail($id);
        $record->update($this->validated($request, $resource, true));
        $this->runAutomaticAlerts($request->user()->company_id);
        return $record;
    }

    public function destroy(Request $request, string $id)
    {
        $this->authorizeWrite($request);
        $this->model($request->segment(2))::where('company_id', $request->user()->company_id)->findOrFail($id)->delete();
        $this->runAutomaticAlerts($request->user()->company_id);
        return response()->noContent();
    }

    public function dashboard(Request $request)
    {
        $this->runAutomaticAlerts($request->user()->company_id);
        return $this->metrics($request);
    }

    public function analytics(Request $request)
    {
        return $this->metrics($request);
    }

    public function reportSummary(Request $request)
    {
        $data = $this->metrics($request);
        $data['history'] = Notification::where('company_id', $request->user()->company_id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($notification) => [
                'name' => $notification->title,
                'created_at' => $notification->created_at->toDateString(),
            ]);
        return $data;
    }

    public function importCsv(Request $request)
    {
        $this->authorizeWrite($request);
        $data = $request->validate(['type' => ['required', Rule::in(['customers','products','sales','expenses'])], 'file' => ['required','file','mimes:csv,txt']]);
        $rows = array_map('str_getcsv', file($data['file']->getRealPath()));
        $header = array_map(fn ($h) => trim(strtolower($h)), array_shift($rows));
        $created = 0;
        foreach ($rows as $row) {
            $payload = array_combine($header, $row);
            if (!$payload) continue;
            $payload['company_id'] = $request->user()->company_id;
            $this->model($data['type'])::create($payload);
            $created++;
        }
        $this->notify($request->user()->company_id, 'Importacao concluida', "$created registos importados com sucesso.", 'success');
        $this->runAutomaticAlerts($request->user()->company_id);
        return ['message' => 'Importacao concluida.', 'created' => $created];
    }

    public function exportCsv(Request $request, string $type)
    {
        abort_unless(isset($this->map[$type]), 404);
        $rows = $this->map[$type]::where('company_id', $request->user()->company_id)->get()->toArray();
        $headers = $rows ? array_keys($rows[0]) : ['id','name'];
        $csv = implode(',', $headers)."\n";
        foreach ($rows as $row) $csv .= implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', (string) $v).'"', array_values($row)))."\n";
        return Response::make($csv, 200, ['Content-Type' => 'text/csv', 'Content-Disposition' => "attachment; filename=$type.csv"]);
    }

    public function notifications(Request $request)
    {
        $this->runAutomaticAlerts($request->user()->company_id);
        return Notification::where('company_id', $request->user()->company_id)->latest()->get();
    }

    public function markNotificationRead(Request $request, Notification $notification)
    {
        abort_unless($notification->company_id === $request->user()->company_id, 403);
        $notification->update(['is_read' => true]);
        return $notification;
    }

    public function aiInsights(Request $request)
    {
        $question = $request->validate(['question' => ['required','string']])['question'];
        $m = $this->metrics($request);
        $firstProduct = $m['top_products'][0] ?? ['name' => 'nenhum produto', 'sales' => 0];
        $bestMonth = collect($m['sales_by_month'])->sortByDesc('revenue')->first() ?? ['month' => 'sem dados', 'revenue' => 0];
        $answer = match (true) {
            str_contains(strtolower($question), 'produto') => 'O produto com melhor desempenho e '.$firstProduct['name'].' com '.$firstProduct['sales'].' vendas registadas.',
            str_contains(strtolower($question), 'despesas') => 'As despesas totais estao em EUR '.number_format($m['total_expenses'], 2, ',', '.').', cerca de '.round(($m['total_expenses'] / max($m['total_revenue'], 1))*100).'% da receita.',
            str_contains(strtolower($question), 'melhor mes') => 'O melhor mes foi '.$bestMonth['month'].' com EUR '.number_format($bestMonth['revenue'], 2, ',', '.').'.',
            default => 'A empresa gerou EUR '.number_format($m['total_revenue'], 2, ',', '.').' em receita, com lucro estimado de EUR '.number_format($m['estimated_profit'], 2, ',', '.').' e crescimento mensal de '.$m['monthly_growth'].'%.',
        };
        return ['answer' => $answer];
    }

    public function settings(Request $request)
    {
        return ['user' => $request->user()->load('company'), 'members' => User::where('company_id', $request->user()->company_id)->get()];
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate(['name' => ['required'], 'email' => ['required','email', Rule::unique('users')->ignore($request->user()->id)]]);
        $request->user()->update($data);
        return $request->user()->load('company');
    }

    public function updateCompany(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['name' => ['required'], 'industry' => ['nullable'], 'employees_count' => ['nullable','integer'], 'plan' => ['nullable'], 'logo' => ['nullable']]);
        $request->user()->company->update($data);
        return $request->user()->company;
    }

    public function updateMemberRole(Request $request, User $member)
    {
        abort_unless($request->user()->role === 'admin' && $member->company_id === $request->user()->company_id, 403);
        $member->update($request->validate(['role' => ['required', Rule::in(['admin','manager','employee'])]]));
        return $member;
    }

    public function updateSecurity(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required'],
            'password' => ['required','min:6','confirmed'],
        ]);
        abort_unless(Hash::check($data['current_password'], $request->user()->password), 422, 'Password atual incorreta.');
        $request->user()->update(['password' => $data['password']]);
        return ['message' => 'Password atualizada com sucesso.'];
    }

    private function metrics(Request $request): array
    {
        $companyId = $request->user()->company_id;
        $from = $request->query('from') ? Carbon::parse($request->query('from'))->startOfDay() : now()->subMonths(11)->startOfMonth();
        $to = $request->query('to') ? Carbon::parse($request->query('to'))->endOfDay() : now()->endOfMonth();
        if ($request->query('year')) {
            $from = Carbon::create((int) $request->query('year'), 1, 1)->startOfYear();
            $to = Carbon::create((int) $request->query('year'), 12, 31)->endOfYear();
        }
        if ($request->query('month')) {
            $year = (int) ($request->query('year') ?: now()->year);
            $from = Carbon::create($year, (int) $request->query('month'), 1)->startOfMonth();
            $to = $from->copy()->endOfMonth();
        }
        $category = $request->query('category');

        $salesQuery = Sale::with('product','customer')->where('company_id', $companyId)->whereBetween('sale_date', [$from, $to]);
        if ($category) $salesQuery->whereHas('product', fn (Builder $query) => $query->where('category', $category));
        $sales = $salesQuery->get();
        $expensesQuery = Expense::where('company_id', $companyId)->whereBetween('expense_date', [$from, $to]);
        if ($category) $expensesQuery->where('category', $category);
        $expenses = $expensesQuery->get();

        $monthlyRevenue = Sale::where('company_id', $companyId)->whereBetween('sale_date', [now()->startOfMonth(), now()->endOfMonth()])->sum('total');
        $lastMonth = Sale::where('company_id', $companyId)->whereBetween('sale_date', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->sum('total');
        $months = collect(range(11, 0))->map(function ($i) use ($companyId, $category) {
            $date = now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();
            $salesQuery = Sale::where('company_id', $companyId)->whereBetween('sale_date', [$start, $end]);
            if ($category) $salesQuery->whereHas('product', fn (Builder $query) => $query->where('category', $category));
            $expenseQuery = Expense::where('company_id', $companyId)->whereBetween('expense_date', [$start, $end]);
            if ($category) $expenseQuery->where('category', $category);
            $revenue = (float) $salesQuery->sum('total');
            $expense = (float) $expenseQuery->sum('amount');
            return ['month' => $date->format('M'), 'revenue' => $revenue, 'expenses' => $expense, 'profit' => $revenue - $expense, 'customers' => Customer::where('company_id', $companyId)->whereBetween('created_at', [$start, $end])->count()];
        })->values();
        $topProducts = $sales->groupBy(fn ($sale) => $sale->product?->name ?? 'Sem produto')->map(fn ($group, $name) => ['name' => $name, 'sales' => $group->sum('quantity'), 'revenue' => round($group->sum('total'), 2)])->sortByDesc('revenue')->values()->take(5)->values();
        $topCustomers = $sales->groupBy(fn ($sale) => $sale->customer?->name ?? 'Cliente direto')->map(fn ($group, $name) => ['name' => $name, 'revenue' => round($group->sum('total'), 2), 'sales' => $group->count()])->sortByDesc('revenue')->values()->take(5)->values();
        $customersCount = Customer::where('company_id', $companyId)->count();
        $newCustomers = Customer::where('company_id', $companyId)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count();
        $previousNewCustomers = Customer::where('company_id', $companyId)->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->count();
        $conversionRate = $customersCount > 0 ? round(($sales->unique('customer_id')->count() / max($customersCount, 1)) * 100, 1) : 0;
        $avgDealSize = $sales->count() > 0 ? round($sales->avg('total'), 2) : 0;
        $recentSales = Sale::with(['customer:id,name','product:id,name'])->where('company_id', $companyId)->latest('sale_date')->latest('id')->take(5)->get()->map(fn ($sale) => ['id' => $sale->id, 'customer' => $sale->customer?->name, 'product' => $sale->product?->name, 'total' => round((float) $sale->total, 2), 'status' => $sale->status, 'date' => Carbon::parse($sale->sale_date)->toDateString()]);
        $recentNotifications = Notification::where('company_id', $companyId)->latest()->take(5)->get(['id','title','message','type','is_read']);
        return [
            'total_revenue' => round($sales->sum('total'), 2),
            'monthly_revenue' => round($monthlyRevenue, 2),
            'estimated_profit' => round($sales->sum('total') - $expenses->sum('amount'), 2),
            'total_expenses' => round($expenses->sum('amount'), 2),
            'customers_count' => $customersCount,
            'products_count' => Product::where('company_id', $companyId)->count(),
            'total_sales' => $sales->count(),
            'active_customers' => Customer::where('company_id', $companyId)->where('status', 'active')->count(),
            'new_customers' => $newCustomers,
            'new_customers_growth' => $previousNewCustomers > 0 ? round((($newCustomers - $previousNewCustomers) / $previousNewCustomers) * 100, 1) : ($newCustomers > 0 ? 100 : 0),
            'conversion_rate' => $conversionRate,
            'avg_deal_size' => $avgDealSize,
            'monthly_growth' => $lastMonth > 0 ? round((($monthlyRevenue - $lastMonth) / $lastMonth) * 100, 1) : 0,
            'top_products' => $topProducts,
            'sales_by_month' => $months,
            'revenue_vs_expenses' => $months,
            'customers_by_month' => $months->map(fn ($m) => ['month' => $m['month'], 'customers' => $m['customers']]),
            'sales_by_category' => $sales->groupBy(fn ($sale) => $sale->product?->category ?? 'Outros')->map(fn ($g, $name) => ['name' => $name, 'value' => round($g->sum('total'), 2)])->values(),
            'top_customers' => $topCustomers,
            'categories' => Product::where('company_id', $companyId)->select('category')->distinct()->orderBy('category')->pluck('category')->values(),
            'years' => Sale::where('company_id', $companyId)->pluck('sale_date')->map(fn ($date) => Carbon::parse($date)->year)->unique()->sortDesc()->values(),
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'month' => $request->query('month'), 'year' => $request->query('year'), 'category' => $category],
            'unread_notifications' => Notification::where('company_id', $companyId)->where('is_read', false)->count(),
            'recent_sales' => $recentSales,
            'recent_notifications' => $recentNotifications,
        ];
    }

    private function model(string $resource): string
    {
        abort_unless(isset($this->map[$resource]), 404);
        return $this->map[$resource];
    }

    private function searchable(string $resource): array
    {
        return match ($resource) {
            'customers' => ['name','email','phone','status'],
            'products' => ['name','category'],
            'sales' => ['status'],
            'expenses' => ['title','category'],
            'employees' => ['name','email','role','department'],
            default => ['name'],
        };
    }

    private function validated(Request $request, string $resource, bool $partial = false): array
    {
        $sometimes = $partial ? 'sometimes' : 'required';
        return match ($resource) {
            'customers' => $request->validate(['name' => [$sometimes], 'email' => ['nullable','email'], 'phone' => ['nullable'], 'status' => ['nullable']]),
            'products' => $request->validate(['name' => [$sometimes], 'category' => [$sometimes], 'price' => [$sometimes,'numeric'], 'stock' => [$sometimes,'integer']]),
            'sales' => $request->validate(['customer_id' => ['nullable','exists:customers,id'], 'product_id' => ['nullable','exists:products,id'], 'quantity' => ['nullable','integer'], 'total' => [$sometimes,'numeric'], 'sale_date' => [$sometimes,'date'], 'status' => ['nullable']]),
            'expenses' => $request->validate(['title' => [$sometimes], 'category' => [$sometimes], 'amount' => [$sometimes,'numeric'], 'expense_date' => [$sometimes,'date']]),
            'employees' => $request->validate(['name' => [$sometimes], 'email' => [$sometimes,'email'], 'role' => [$sometimes], 'department' => [$sometimes]]),
        };
    }

    private function authorizeWrite(Request $request): void
    {
        abort_if($request->user()->role === 'employee', 403, 'O perfil employee apenas pode consultar dados.');
    }

    private function runAutomaticAlerts(int $companyId): void
    {
        $lowStock = Product::where('company_id', $companyId)->where('stock', '<=', 10)->orderBy('stock')->take(5)->get();
        if ($lowStock->isNotEmpty()) {
            $this->notifyOnce($companyId, 'Stock baixo', 'Produtos com stock critico: '.$lowStock->pluck('name')->join(', ').'.', 'warning');
        }

        $monthRevenue = (float) Sale::where('company_id', $companyId)->whereBetween('sale_date', [now()->startOfMonth(), now()->endOfMonth()])->sum('total');
        $monthExpenses = (float) Expense::where('company_id', $companyId)->whereBetween('expense_date', [now()->startOfMonth(), now()->endOfMonth()])->sum('amount');
        if ($monthRevenue > 0 && $monthExpenses > ($monthRevenue * 0.65)) {
            $this->notifyOnce($companyId, 'Despesas elevadas', 'As despesas deste mes ultrapassaram 65% da receita mensal.', 'danger');
        }

        $lastRevenue = (float) Sale::where('company_id', $companyId)->whereBetween('sale_date', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->sum('total');
        if ($lastRevenue > 0 && $monthRevenue < ($lastRevenue * 0.85)) {
            $this->notifyOnce($companyId, 'Receita abaixo do esperado', 'A receita deste mes esta abaixo de 85% do mes anterior.', 'warning');
        }
    }

    private function notifyOnce(int $companyId, string $title, string $message, string $type = 'info'): void
    {
        Notification::firstOrCreate(
            ['company_id' => $companyId, 'title' => $title, 'is_read' => false],
            ['message' => $message, 'type' => $type]
        );
    }

    private function notify(int $companyId, string $title, string $message, string $type = 'info'): void
    {
        Notification::create(['company_id' => $companyId, 'title' => $title, 'message' => $message, 'type' => $type]);
    }
}


