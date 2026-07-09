<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id','customer_id','product_id','total','sale_date','status','quantity'])]
class Sale extends Model
{
    use HasFactory;

    protected function casts(): array { return ['sale_date' => 'date', 'total' => 'decimal:2']; }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
